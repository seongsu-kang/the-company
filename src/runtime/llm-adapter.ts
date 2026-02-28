import Anthropic from '@anthropic-ai/sdk';
import type { Message, ToolDef, LLMResponse, ToolResult } from '../types.js';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();  // reads ANTHROPIC_API_KEY from env
  }
  return client;
}

/**
 * Convert our Message[] to Anthropic API format.
 * Separates system message from conversation messages.
 */
function toApiMessages(messages: Message[]): {
  system: string;
  messages: Anthropic.MessageParam[];
} {
  let system = '';
  const apiMsgs: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system += (system ? '\n\n' : '') + msg.content;
    } else {
      apiMsgs.push({ role: msg.role, content: msg.content });
    }
  }

  return { system, messages: apiMsgs };
}

/**
 * Chat with Claude API.
 */
export async function chat(
  messages: Message[],
  tools?: ToolDef[],
  toolResults?: ToolResult[],
): Promise<LLMResponse> {
  const api = getClient();
  const { system, messages: apiMsgs } = toApiMessages(messages);

  // If we have tool results, append them as a user message
  if (toolResults && toolResults.length > 0) {
    apiMsgs.push({
      role: 'user',
      content: toolResults.map((r) => ({
        type: 'tool_result' as const,
        tool_use_id: r.tool_use_id,
        content: r.content,
        is_error: r.is_error,
      })),
    });
  }

  const params: Anthropic.MessageCreateParams = {
    model: process.env.TC_MODEL ?? DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: apiMsgs,
  };

  if (tools && tools.length > 0) {
    params.tools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool.InputSchema,
    }));
  }

  const response = await api.messages.create(params);

  // Extract text and tool calls
  let content = '';
  const toolCalls: LLMResponse['toolCalls'] = [];

  for (const block of response.content) {
    if (block.type === 'text') {
      content += block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    }
  }

  return {
    content,
    toolCalls,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    stopReason: response.stop_reason as LLMResponse['stopReason'],
  };
}
