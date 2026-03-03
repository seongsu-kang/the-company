import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { assembleContext } from '../context-assembler.js';
import type { ExecutionRunner, RunnerConfig, RunnerCallbacks, RunnerHandle, RunnerResult } from './types.js';

/* ─── Claude CLI Runner ──────────────────────── */

/**
 * Claude Code CLI (`claude -p`)를 실행 엔진으로 사용.
 *
 * - Context Assembler가 조립한 시스템 프롬프트를 --system-prompt로 전달
 * - claude -p (print mode)로 실행, stdout의 stream-json을 파싱
 * - Claude Code가 내장 도구(Read, Write, Edit, Bash 등)를 자체적으로 실행
 * - 구독 기반이므로 API 비용 부담 없음
 *
 * 향후 EXECUTION_ENGINE=direct-api로 전환 시 direct-api.ts로 교체.
 */
export class ClaudeCliRunner implements ExecutionRunner {
  execute(config: RunnerConfig, callbacks: RunnerCallbacks): RunnerHandle {
    const { companyRoot, roleId, task, sourceRole, orgTree, readOnly = false } = config;

    // 1. Context Assembly
    const context = assembleContext(companyRoot, roleId, task, sourceRole, orgTree);

    // 2. System prompt를 임시 파일로 저장 (CLI arg 길이 제한 대비)
    const tmpDir = path.join(os.tmpdir(), 'the-company-engine');
    fs.mkdirSync(tmpDir, { recursive: true });
    const promptFile = path.join(tmpDir, `ctx-${roleId}-${Date.now()}.md`);
    fs.writeFileSync(promptFile, context.systemPrompt);

    // 3. readOnly면 시스템 프롬프트에 쓰기 금지 지시 추가
    let taskPrompt = task;
    if (readOnly) {
      taskPrompt = `[READ-ONLY MODE: 파일 수정/생성 금지. 읽기와 분석만 수행]\n\n${task}`;
    }

    // 4. Playwright MCP 설정 — 각 runner 인스턴스가 독립 브라우저 사용
    const runnerOutputDir = path.join(tmpDir, `playwright-${roleId}-${Date.now()}`);
    fs.mkdirSync(runnerOutputDir, { recursive: true });
    const mcpConfig = JSON.stringify({
      mcpServers: {
        playwright: {
          type: 'stdio',
          command: '/Users/nodias/.local/bin/playwright-mcp.sh',
          args: ['--output-dir', runnerOutputDir],
        },
      },
    });

    // 5. CLI args 구성
    const args = [
      '-p',
      '--system-prompt', fs.readFileSync(promptFile, 'utf-8'),
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
      '--model', config.model ?? 'claude-sonnet-4-5',
      '--mcp-config', mcpConfig,
      '--strict-mcp-config',
      taskPrompt,
    ];

    // 6. 프로세스 생성 — 중첩 세션 방지를 위해 CLAUDECODE 환경변수 제거
    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;

    const modelName = config.model ?? 'claude-sonnet-4-5';
    console.log(`[Runner] Spawning claude -p: role=${roleId}, model=${modelName}, prompt=${(args[2]?.length ?? 0)}chars`);

    const proc = spawn('claude', args, {
      cwd: companyRoot,
      env: cleanEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let turnCount = 0;
    const toolCalls: RunnerResult['toolCalls'] = [];
    const dispatches: RunnerResult['dispatches'] = [];

    const promise = new Promise<RunnerResult>((resolve, reject) => {
      let buffer = '';

      proc.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();

        // stream-json: 줄 단위 JSON 파싱
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // 마지막 불완전 줄은 버퍼에 보관

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            processStreamEvent(event, callbacks, {
              appendOutput: (t) => { output += t; },
              addToolCall: (name, input) => { toolCalls.push({ name, input }); },
              incrementTurn: () => { turnCount++; callbacks.onTurnComplete?.(turnCount); },
            });
          } catch {
            // JSON 파싱 실패 — 일반 텍스트로 처리
            output += line;
            callbacks.onText?.(line);
          }
        }
      });

      proc.stderr.on('data', (data: Buffer) => {
        callbacks.onError?.(data.toString());
      });

      proc.on('close', (code, signal) => {
        console.log(`[Runner] Done: code=${code}, signal=${signal}, output=${output.length}chars`);
        // 버퍼에 남은 데이터 처리
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            processStreamEvent(event, callbacks, {
              appendOutput: (t) => { output += t; },
              addToolCall: (name, input) => { toolCalls.push({ name, input }); },
              incrementTurn: () => { turnCount++; },
            });
          } catch {
            output += buffer;
            callbacks.onText?.(buffer);
          }
        }

        // 임시 파일 정리
        try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
        try { fs.rmSync(runnerOutputDir, { recursive: true, force: true }); } catch { /* ignore */ }

        // 비정상 종료 시에도 결과 반환 (output이 있을 수 있으므로)
        resolve({
          output,
          turns: turnCount || 1,
          totalTokens: { input: 0, output: 0 }, // CLI에서는 토큰 추적 불가
          toolCalls,
          dispatches,
        });
      });

      proc.on('error', (err) => {
        try { fs.unlinkSync(promptFile); } catch { /* ignore */ }
        try { fs.rmSync(runnerOutputDir, { recursive: true, force: true }); } catch { /* ignore */ }
        reject(err);
      });
    });

    return {
      promise,
      abort: () => proc.kill('SIGTERM'),
    };
  }
}

/* ─── Stream JSON Event Handler ──────────────── */

interface StreamHandlers {
  appendOutput: (text: string) => void;
  addToolCall: (name: string, input?: Record<string, unknown>) => void;
  incrementTurn: () => void;
}

function processStreamEvent(
  event: Record<string, unknown>,
  callbacks: RunnerCallbacks,
  handlers: StreamHandlers,
): void {
  const type = event.type as string;

  switch (type) {
    case 'assistant': {
      // stream-json format: { type: "assistant", message: { content: [...] } }
      const message = event.message as Record<string, unknown> | undefined;
      const content = message?.content ?? event.content;

      if (Array.isArray(content)) {
        for (const block of content as Record<string, unknown>[]) {
          if (block.type === 'text' && typeof block.text === 'string') {
            handlers.appendOutput(block.text);
            callbacks.onText?.(block.text);
          } else if (block.type === 'tool_use' && typeof block.name === 'string') {
            handlers.addToolCall(block.name, block.input as Record<string, unknown>);
            callbacks.onToolUse?.(block.name, block.input as Record<string, unknown>);
          } else if (block.type === 'thinking' && typeof block.thinking === 'string') {
            callbacks.onThinking?.(block.thinking);
          }
        }
      }
      // Turn tracking
      handlers.incrementTurn();
      break;
    }

    case 'result': {
      // 최종 결과: { type: "result", result: "..." }
      // result 텍스트는 assistant 이벤트에서 이미 전달됨 — 중복 방지를 위해 스킵
      // (result는 최종 요약이므로 별도 처리 불필요)
      break;
    }

    case 'content_block_delta': {
      const delta = event.delta as Record<string, unknown> | undefined;
      if (delta && typeof delta.text === 'string') {
        handlers.appendOutput(delta.text);
        callbacks.onText?.(delta.text);
      }
      break;
    }

    default:
      // system, ping, 기타 이벤트 무시
      break;
  }
}
