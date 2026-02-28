#!/usr/bin/env node
import { Command } from 'commander';
import { requireCompany, findCompanyRoot, getCompanyInfo } from '../core/company.js';
import { loadRole, loadAllRoles } from '../core/role-loader.js';
import { buildPrompt } from '../core/context-assembler.js';
import { executeWithClaudeCode } from '../runtime/executor.js';
import {
  writeFileSync, existsSync, mkdirSync, readFileSync, appendFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';

const program = new Command();
program.name('tc').version('0.1.0').description('The Company — AI Role 기반 회사 운영');

// ─── tc assign <role> <task> ─────────────────────────────────
program
  .command('assign <roleId> <task>')
  .description('Role에게 업무 위임')
  .action((roleId: string, task: string) => {
    const company = requireCompany();
    const role = loadRole(company.root, roleId);

    console.log(`[${company.name}] → ${role.name} (${role.level})`);
    console.log(`  Task: ${task}\n`);

    const prompt = buildPrompt(role, task, company);
    const result = executeWithClaudeCode(prompt, company.root);

    logJournal(company.root, roleId, task, result);

    console.log('='.repeat(60));
    console.log(`  ${role.name} Report`);
    console.log('='.repeat(60));
    console.log(result);
    console.log(`\n  Logged: roles/${roleId}/journal/${today()}.md`);

    if (result.includes('[APPROVAL_NEEDED]')) {
      console.log('  ⚠ CEO 승인 필요 항목 있음');
    }
  });

// ─── tc wave <directive> ─────────────────────────────────────
program
  .command('wave <directive>')
  .description('CEO 지시 → C-Level 분해 → 병렬 디스패치')
  .action((directive: string) => {
    const company = requireCompany();
    const roles = loadAllRoles(company.root);
    const cLevels = roles.filter((r) => r.level === 'c-level');
    const teams = roles.filter((r) => r.level !== 'c-level');

    if (cLevels.length === 0) {
      console.error('Error: C-Level Role이 없습니다.');
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log(`  ${company.name} — Wave Dispatch`);
    console.log('='.repeat(60));
    console.log(`  CEO: ${directive}`);
    console.log(`  C-Level: ${cLevels.map((r) => r.id).join(', ')}`);
    console.log(`  Teams: ${teams.map((r) => r.id).join(', ')}\n`);

    // Step 1: C-Level decomposes
    const lead = cLevels[0];
    const teamList = teams.map((r) => `  - ${r.id}: ${r.name} (${r.level})`).join('\n');
    const decomposePrompt = buildPrompt(lead, `CEO의 지시를 팀별 태스크로 분해하세요.

## CEO 지시
${directive}

## 사용 가능한 팀
${teamList}

## 출력 형식 (반드시 이 JSON 형식만 출력, 도구 사용하지 말 것)
\`\`\`json
[
  {"role": "role_id", "task": "구체적 태스크 설명"}
]
\`\`\`

규칙:
- 독립적인 태스크는 서로 다른 팀에 배정
- JSON 코드블록만 출력하세요`, company);

    console.log(`  [${lead.id}] 태스크 분해 중...`);
    const decomposeResult = executeWithClaudeCode(decomposePrompt, company.root);
    logJournal(company.root, lead.id, `Wave 분해: ${directive.slice(0, 50)}`, decomposeResult);

    // Parse JSON
    const jsonMatch = decomposeResult.match(/```(?:json)?\s*\n?([\s\S]*?)```/) ??
      decomposeResult.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error(`  [ERROR] 태스크 분해 실패:\n${decomposeResult.slice(0, 500)}`);
      return;
    }

    let tasks: Array<{ role: string; task: string }>;
    try {
      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      tasks = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`  [ERROR] JSON 파싱 실패: ${e}`);
      return;
    }

    const validIds = new Set(roles.map((r) => r.id));
    tasks = tasks.filter((t) => validIds.has(t.role));

    if (tasks.length === 0) {
      console.log('  분해된 태스크가 없습니다.');
      return;
    }

    console.log(`\n  Wave: ${tasks.length} tasks dispatching...`);
    for (const t of tasks) {
      console.log(`    → ${t.role}: ${t.task.slice(0, 60)}`);
    }
    console.log();

    // Step 2: Execute each task (sequential — Claude Code spawns are heavy)
    const results: Array<{ roleId: string; output: string }> = [];
    for (const t of tasks) {
      const role = loadRole(company.root, t.role);
      const prompt = buildPrompt(role, t.task, company);
      const output = executeWithClaudeCode(prompt, company.root);
      logJournal(company.root, t.role, t.task, output);
      console.log(`  ✓ ${t.role} 완료`);
      results.push({ roleId: t.role, output });
    }

    // Step 3: Report
    console.log(`\n${'='.repeat(60)}`);
    console.log('  Wave Results');
    console.log('='.repeat(60));

    for (const { roleId, output } of results) {
      console.log(`\n--- ${roleId} ---`);
      console.log(output.slice(0, 500));
      if (output.length > 500) console.log(`  ... (${output.length} chars total)`);
    }

    // Save wave log
    const waveDir = join(company.root, 'operations', 'waves');
    mkdirSync(waveDir, { recursive: true });
    const now = new Date();
    const waveFile = join(waveDir, `${fmtDate(now)}.md`);
    let waveContent = `# Wave — ${now.toISOString().slice(0, 16).replace('T', ' ')}\n\n`;
    waveContent += `## CEO Directive\n\n${directive}\n\n`;
    waveContent += `## Tasks (${tasks.length})\n\n`;
    for (const t of tasks) waveContent += `- **${t.role}**: ${t.task}\n`;
    waveContent += `\n## Results\n\n`;
    for (const { roleId, output } of results) {
      waveContent += `### ${roleId}\n\n${output.slice(0, 2000)}\n\n---\n\n`;
    }
    writeFileSync(waveFile, waveContent);
    console.log(`\n  Wave log: operations/waves/${fmtDate(now)}.md`);

    const approvals = results.filter((r) => r.output.includes('[APPROVAL_NEEDED]'));
    if (approvals.length > 0) {
      console.log(`  ⚠ CEO 승인 필요: ${approvals.map((a) => a.roleId).join(', ')}`);
    }
  });

// ─── tc roles ────────────────────────────────────────────────
program
  .command('roles')
  .description('조직 현황')
  .action(() => {
    const root = findCompanyRoot();
    if (!root) {
      console.log('No company found. Run tc init to create one.');
      return;
    }
    const company = getCompanyInfo(root);
    const allRoles = loadAllRoles(root);

    console.log(`${company.name} Roles:\n`);
    const badge: Record<string, string> = { 'c-level': '★', 'team-lead': '◆', member: '·' };
    for (const level of ['c-level', 'team-lead', 'member'] as const) {
      const levelRoles = allRoles.filter((r) => r.level === level);
      if (levelRoles.length === 0) continue;
      console.log(`  ${level}:`);
      for (const r of levelRoles) {
        console.log(`    ${badge[level]} ${r.id.padEnd(15)} ${r.name.padEnd(30)} → ${r.reports_to}`);
      }
    }
    console.log(`\n  Total: ${allRoles.length} roles`);
  });

// ─── tc status ───────────────────────────────────────────────
program
  .command('status')
  .description('대시보드')
  .action(() => {
    const company = requireCompany();
    const roles = loadAllRoles(company.root);
    const d = today();

    console.log('='.repeat(60));
    console.log(`  ${company.name} — Status Dashboard`);
    console.log(`  ${d}`);
    console.log('='.repeat(60) + '\n');

    const c = roles.filter((r) => r.level === 'c-level');
    const l = roles.filter((r) => r.level === 'team-lead');
    const m = roles.filter((r) => r.level === 'member');
    console.log('  Organization:');
    console.log(`    C-Level: ${c.length} (${c.map((r) => r.id).join(', ')})`);
    console.log(`    Team Leads: ${l.length} (${l.map((r) => r.id).join(', ')})`);
    console.log(`    Members: ${m.length} (${m.map((r) => r.id).join(', ')})`);

    const projDir = join(company.root, 'projects');
    if (existsSync(projDir)) {
      const projs = readdirSync(projDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      console.log(`  Projects: ${projs.length}${projs.length ? ` (${projs.join(', ')})` : ''}`);
    }

    // Wave count
    const waveDir = join(company.root, 'operations', 'waves');
    if (existsSync(waveDir)) {
      const waves = readdirSync(waveDir).filter((f) => f.endsWith('.md'));
      console.log(`  Waves: ${waves.length}`);
    }

    // Today's task count
    let taskCount = 0;
    for (const role of roles) {
      const j = join(company.root, 'roles', role.id, 'journal', `${d}.md`);
      if (existsSync(j)) {
        taskCount += (readFileSync(j, 'utf-8').match(/### /g) ?? []).length;
      }
    }
    console.log(`  Today's tasks: ${taskCount}`);
    console.log();
  });

// ─── tc standup ──────────────────────────────────────────────
program
  .command('standup')
  .description('일일 스탠드업')
  .action(() => {
    const company = requireCompany();
    const roles = loadAllRoles(company.root);
    const d = today();

    console.log('='.repeat(60));
    console.log(`  ${company.name} — Daily Standup (${d})`);
    console.log('='.repeat(60) + '\n');

    let content = `# Daily Standup — ${d}\n\n`;
    const badge: Record<string, string> = { 'c-level': '★', 'team-lead': '◆', member: '·' };

    for (const role of roles) {
      const journalPath = join(company.root, 'roles', role.id, 'journal', `${d}.md`);
      const b = badge[role.level] ?? '·';
      if (existsSync(journalPath)) {
        const jContent = readFileSync(journalPath, 'utf-8');
        const entries = (jContent.match(/### /g) ?? []).length;
        console.log(`  ${b} [${role.id.padEnd(12)}] ${role.name}: ${entries} tasks`);
        content += `## ${role.name} (${role.level})\n\n${jContent.slice(0, 2000)}\n\n---\n\n`;
      } else {
        console.log(`  ${b} [${role.id.padEnd(12)}] ${role.name}: (no activity)`);
        content += `## ${role.name} (${role.level})\n\n_(no activity)_\n\n---\n\n`;
      }
    }

    const standupDir = join(company.root, 'operations', 'standup');
    mkdirSync(standupDir, { recursive: true });
    writeFileSync(join(standupDir, `${d}.md`), content);
    console.log(`\n  Saved: operations/standup/${d}.md`);
  });

// ─── helpers ─────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 16).replace('T', '-').replace(':', '');
}

function logJournal(root: string, roleId: string, task: string, result: string): void {
  const dir = join(root, 'roles', roleId, 'journal');
  mkdirSync(dir, { recursive: true });
  const d = today();
  const file = join(dir, `${d}.md`);
  const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const entry = `\n### ${now} — ${task.slice(0, 80)}\n\n${result.slice(0, 3000)}\n\n---\n`;

  if (existsSync(file)) {
    appendFileSync(file, entry);
  } else {
    writeFileSync(file, `# ${roleId.toUpperCase()} Journal — ${d}\n${entry}`);
  }
}

program.parse();
