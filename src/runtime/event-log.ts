import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AgentEvent } from '../types.js';

/**
 * Append an event to the daily JSONL log.
 */
export function appendEventLog(logDir: string, event: AgentEvent): void {
  const date = event.timestamp.slice(0, 10); // YYYY-MM-DD
  const dir = join(logDir, date);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const file = join(dir, `${event.roleId}.jsonl`);
  appendFileSync(file, JSON.stringify(event) + '\n');
}
