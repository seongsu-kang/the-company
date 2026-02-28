import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Role, CompanyInfo } from '../types.js';

/**
 * Collect knowledge files a role can read.
 * Reads hub .md files from each knowledge path (max 3 per dir, truncated to 1500 chars).
 */
function collectKnowledge(companyRoot: string, readPaths: string[]): string {
  const parts: string[] = [];

  for (const readPath of readPaths) {
    const target = join(companyRoot, readPath.replace(/\/$/, ''));
    if (existsSync(target)) {
      try {
        const stat = statSync(target);
        if (stat.isFile()) {
          const content = readFileSync(target, 'utf-8').slice(0, 2000);
          parts.push(`--- ${readPath} ---\n${content}`);
        } else if (stat.isDirectory()) {
          const mds = readdirSync(target)
            .filter((f: string) => f.endsWith('.md'))
            .sort()
            .slice(0, 3);
          for (const md of mds) {
            const content = readFileSync(join(target, md), 'utf-8').slice(0, 1500);
            parts.push(`--- ${readPath}${md} ---\n${content}`);
          }
        }
      } catch { /* skip unreadable */ }
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : '(관련 문서 없음)';
}

/**
 * Assemble a system prompt for a role.
 */
export function assembleSystemPrompt(role: Role, company: CompanyInfo): string {
  const knowledge = collectKnowledge(company.root, role.knowledge?.reads ?? []);

  return `당신은 ${company.name}의 ${role.name}입니다.
직급: ${role.level} | 보고 대상: ${role.reports_to}

## Persona
${role.persona}

## 행동 규칙
- 자율 행동 가능: ${role.authority.autonomous.join(', ')}
- CEO 승인 필요: ${role.authority.needs_approval.join(', ')}
- 작업 결과는 반드시 회사 AKB 파일로 기록하세요.
- CEO 승인이 필요한 사안은 [APPROVAL_NEEDED] 태그와 함께 보고하세요.

## 회사 컨텍스트
${knowledge}`;
}

/**
 * Build the full prompt with task appended.
 */
export function buildPrompt(role: Role, task: string, company: CompanyInfo): string {
  const system = assembleSystemPrompt(role, company);
  return `${system}

## 태스크
${task}

## 출력 형식
1. 작업 결과
2. 생성/수정한 파일 목록
3. CEO 보고 사항
4. [APPROVAL_NEEDED] 항목 (있으면)`;
}
