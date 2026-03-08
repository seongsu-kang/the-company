export interface ToolDefinition {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
}
export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}
export interface ToolResult {
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}
export type MessageContent = {
    type: 'text';
    text: string;
} | {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, unknown>;
};
export interface LLMResponse {
    content: MessageContent[];
    stopReason: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
}
export interface LLMMessage {
    role: 'user' | 'assistant';
    content: string | MessageContent[];
}
export interface StreamCallbacks {
    onText?: (text: string) => void;
    onToolUse?: (toolCall: ToolCall) => void;
    onDone?: (response: LLMResponse) => void;
}
/**
 * LLM 프로바이더 추상화 인터페이스.
 *
 * 구현체:
 *   - AnthropicProvider: @anthropic-ai/sdk 기반 (기본)
 *   - (향후) OpenAIProvider, OllamaProvider, MockProvider
 */
export interface LLMProvider {
    chat(systemPrompt: string, messages: LLMMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<LLMResponse>;
    chatStream?(systemPrompt: string, messages: LLMMessage[], tools: ToolDefinition[] | undefined, callbacks: StreamCallbacks): Promise<LLMResponse>;
}
export declare class AnthropicProvider implements LLMProvider {
    private client;
    private model;
    constructor(options?: {
        apiKey?: string;
        model?: string;
    });
    /**
     * Send a message and get a complete response (non-streaming)
     */
    chat(systemPrompt: string, messages: LLMMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<LLMResponse>;
    /**
     * Send a message with streaming (for SSE)
     */
    chatStream(systemPrompt: string, messages: LLMMessage[], tools: ToolDefinition[] | undefined, callbacks: StreamCallbacks): Promise<LLMResponse>;
    private mapContent;
}
/** @deprecated Use AnthropicProvider instead */
export declare const LLMAdapter: typeof AnthropicProvider;
