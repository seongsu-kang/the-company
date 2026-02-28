import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import fg from 'fast-glob';
import type { ToolDef, ToolResult } from '../../types.js';

/** All built-in tool definitions for LLM function calling. */
export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'read_file',
    description: 'Read a file. Returns file contents.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative or absolute file path' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates parent directories if needed.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'File content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files matching a glob pattern.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.md")' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'search_content',
    description: 'Search file contents for a pattern (grep-like).',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (regex)' },
        glob: { type: 'string', description: 'File glob filter (e.g., "*.md")' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command. Use for git, npm, etc. Timeout: 30s.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
      },
      required: ['command'],
    },
  },
];

/**
 * Execute a tool call and return the result.
 */
export function executeTool(
  name: string,
  input: Record<string, unknown>,
  workingDir: string,
): ToolResult & { _toolUseId?: string } {
  try {
    switch (name) {
      case 'read_file': {
        const p = resolve(workingDir, input.path as string);
        if (!existsSync(p)) return { tool_use_id: '', content: `File not found: ${p}`, is_error: true };
        return { tool_use_id: '', content: readFileSync(p, 'utf-8').slice(0, 50000) };
      }

      case 'write_file': {
        const p = resolve(workingDir, input.path as string);
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, input.content as string);
        return { tool_use_id: '', content: `Written: ${p}` };
      }

      case 'list_files': {
        const files = fg.sync(input.pattern as string, {
          cwd: workingDir,
          ignore: ['node_modules/**', '.git/**'],
          onlyFiles: true,
        });
        return { tool_use_id: '', content: files.slice(0, 100).join('\n') || '(no matches)' };
      }

      case 'search_content': {
        const globFilter = (input.glob as string) ?? '**/*';
        const files = fg.sync(globFilter, {
          cwd: workingDir,
          ignore: ['node_modules/**', '.git/**'],
          onlyFiles: true,
        });
        const re = new RegExp(input.pattern as string, 'gi');
        const matches: string[] = [];
        for (const f of files.slice(0, 50)) {
          try {
            const content = readFileSync(join(workingDir, f), 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (re.test(lines[i])) {
                matches.push(`${f}:${i + 1}: ${lines[i].slice(0, 200)}`);
              }
              re.lastIndex = 0;
            }
          } catch { /* skip binary */ }
          if (matches.length >= 50) break;
        }
        return { tool_use_id: '', content: matches.join('\n') || '(no matches)' };
      }

      case 'run_command': {
        const cmd = input.command as string;
        // Block dangerous commands
        if (/rm\s+-rf\s+[/~]|mkfs|dd\s+if=/.test(cmd)) {
          return { tool_use_id: '', content: 'Blocked: dangerous command', is_error: true };
        }
        const output = execSync(cmd, {
          cwd: workingDir,
          timeout: 30_000,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
        });
        return { tool_use_id: '', content: output.slice(0, 10000) };
      }

      default:
        return { tool_use_id: '', content: `Unknown tool: ${name}`, is_error: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { tool_use_id: '', content: `Error: ${msg.slice(0, 1000)}`, is_error: true };
  }
}
