import { chat } from './llm-adapter.js';
import { TOOL_DEFS, executeTool } from './tools/index.js';
import { appendEventLog } from './event-log.js';
import type { Message, ToolResult, AgentEvent } from '../types.js';

const MAX_TURNS = 25;

export interface AgentResult {
  output: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  turns: number;
  events: AgentEvent[];
}

/**
 * Run the agent loop: LLM ↔ Tool execution until end_turn or max turns.
 */
export async function runAgent(
  systemPrompt: string,
  task: string,
  workingDir: string,
  roleId: string,
  logDir?: string,
): Promise<AgentResult> {
  const sessionId = `sess_${Date.now().toString(36)}`;
  const events: AgentEvent[] = [];
  let totalIn = 0;
  let totalOut = 0;
  let turns = 0;
  let output = '';

  // Start event
  events.push({
    timestamp: new Date().toISOString(),
    sessionId,
    roleId,
    type: 'task_start',
    data: { task: task.slice(0, 200) },
  });

  // Initial messages
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: task },
  ];

  // Accumulate API messages for multi-turn
  const apiMessages: Array<{ role: string; content: unknown }> = [
    { role: 'user', content: task },
  ];

  let pendingToolResults: ToolResult[] | undefined;

  while (turns < MAX_TURNS) {
    turns++;

    const response = await chat(messages, TOOL_DEFS, pendingToolResults);
    totalIn += response.inputTokens;
    totalOut += response.outputTokens;

    events.push({
      timestamp: new Date().toISOString(),
      sessionId,
      roleId,
      type: 'llm_call',
      data: {
        turn: turns,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        stopReason: response.stopReason,
        toolCallCount: response.toolCalls.length,
      },
    });

    if (response.content) {
      output += (output ? '\n' : '') + response.content;
    }

    // No tool calls → done
    if (response.toolCalls.length === 0 || response.stopReason === 'end_turn') {
      break;
    }

    // Execute tool calls
    const toolResults: ToolResult[] = [];
    for (const tc of response.toolCalls) {
      events.push({
        timestamp: new Date().toISOString(),
        sessionId,
        roleId,
        type: 'tool_call',
        data: { tool: tc.name, input: tc.input },
      });

      const result = executeTool(tc.name, tc.input, workingDir);
      result.tool_use_id = tc.id;

      events.push({
        timestamp: new Date().toISOString(),
        sessionId,
        roleId,
        type: 'tool_result',
        data: {
          tool: tc.name,
          success: !result.is_error,
          contentLength: result.content.length,
        },
      });

      toolResults.push(result);
    }

    // For next iteration: include assistant response + tool results in messages
    // We rebuild messages each turn to keep context simple
    messages.push({ role: 'assistant', content: response.content || '(tool use)' });
    messages.push({
      role: 'user',
      content: toolResults.map((r) =>
        `[Tool Result: ${r.tool_use_id}]\n${r.content}`
      ).join('\n\n'),
    });

    pendingToolResults = toolResults;
  }

  // End event
  events.push({
    timestamp: new Date().toISOString(),
    sessionId,
    roleId,
    type: 'task_end',
    data: { turns, totalInputTokens: totalIn, totalOutputTokens: totalOut },
  });

  // Persist event log
  if (logDir) {
    for (const event of events) {
      appendEventLog(logDir, event);
    }
  }

  return { output, totalInputTokens: totalIn, totalOutputTokens: totalOut, turns, events };
}
