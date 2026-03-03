/**
 * auth-detect.ts — Detect available execution engine
 *
 * Priority:
 *   1. Claude CLI installed + authenticated → claude-cli (zero config)
 *   2. ANTHROPIC_API_KEY in env/.env → direct-api (BYOK)
 *   3. Neither → prompt user
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface AuthResult {
  engine: 'claude-cli' | 'direct-api' | 'none';
  message: string;
}

/**
 * Check if `claude` CLI is installed and can respond.
 */
function hasClaudeCli(): boolean {
  try {
    const result = execSync('claude --version 2>/dev/null', {
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, CLAUDECODE: '' },
    });
    return result.toString().includes('Claude Code');
  } catch {
    return false;
  }
}

/**
 * Check if ANTHROPIC_API_KEY is available (env or .env file).
 */
function hasApiKey(): boolean {
  if (process.env.ANTHROPIC_API_KEY) return true;

  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    return /^ANTHROPIC_API_KEY=.+/m.test(content);
  }
  return false;
}

/**
 * Detect the best available execution engine.
 */
export function detectAuth(): AuthResult {
  if (hasClaudeCli()) {
    return {
      engine: 'claude-cli',
      message: 'Claude Code CLI detected. No API key needed.',
    };
  }

  if (hasApiKey()) {
    return {
      engine: 'direct-api',
      message: 'ANTHROPIC_API_KEY found. Using direct API mode.',
    };
  }

  return {
    engine: 'none',
    message: 'No Claude CLI or API key found.',
  };
}
