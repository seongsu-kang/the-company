import { execFileSync } from 'node:child_process';

/**
 * Execute a task via Claude Code CLI (Phase 0 engine).
 * Same pattern as Python tc.py — spawn `claude -p` subprocess.
 *
 * Phase 1: Replace with direct Claude API + Agent Loop.
 */
export function executeWithClaudeCode(
  prompt: string,
  workingDir: string,
  timeoutMs = 300_000,
): string {
  // Remove CLAUDECODE env to avoid nested session error
  const env = { ...process.env };
  delete env.CLAUDECODE;

  try {
    const output = execFileSync('claude', [
      '-p', prompt,
      '--dangerously-skip-permissions',
      '--no-session-persistence',
      '--output-format', 'text',
    ], {
      cwd: workingDir,
      timeout: timeoutMs,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      env,
    });
    return output.trim();
  } catch (err: any) {
    if (err.killed) return '[ERROR] 실행 시간 초과.';
    if (err.stderr) return `[ERROR] ${err.stderr.slice(0, 500)}`;
    return `[ERROR] ${err.message?.slice(0, 500) ?? 'Unknown error'}`;
  }
}
