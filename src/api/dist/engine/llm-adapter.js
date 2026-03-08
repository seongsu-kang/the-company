import Anthropic from '@anthropic-ai/sdk';
/* ─── Anthropic Provider ─────────────────────── */
export class AnthropicProvider {
    client;
    model;
    constructor(options) {
        this.client = new Anthropic({
            apiKey: options?.apiKey || process.env.ANTHROPIC_API_KEY,
        });
        this.model = options?.model || process.env.LLM_MODEL || 'claude-sonnet-4-20250514';
    }
    /**
     * Send a message and get a complete response (non-streaming)
     */
    async chat(systemPrompt, messages, tools, signal) {
        const params = {
            model: this.model,
            max_tokens: 8192,
            system: systemPrompt,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        };
        if (tools && tools.length > 0) {
            params.tools = tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.input_schema,
            }));
        }
        const response = await this.client.messages.create(params, { signal });
        return {
            content: this.mapContent(response.content),
            stopReason: response.stop_reason ?? 'end_turn',
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
            },
        };
    }
    /**
     * Send a message with streaming (for SSE)
     */
    async chatStream(systemPrompt, messages, tools, callbacks) {
        const params = {
            model: this.model,
            max_tokens: 8192,
            stream: true,
            system: systemPrompt,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        };
        if (tools && tools.length > 0) {
            params.tools = tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.input_schema,
            }));
        }
        const stream = this.client.messages.stream(params);
        const contentBlocks = [];
        let currentToolInput = '';
        let currentToolId = '';
        let currentToolName = '';
        stream.on('text', (text) => {
            callbacks.onText?.(text);
        });
        stream.on('contentBlock', (block) => {
            if (block.type === 'text') {
                contentBlocks.push({ type: 'text', text: block.text });
            }
            else if (block.type === 'tool_use') {
                const toolCall = {
                    id: block.id,
                    name: block.name,
                    input: block.input,
                };
                contentBlocks.push({
                    type: 'tool_use',
                    id: block.id,
                    name: block.name,
                    input: block.input,
                });
                callbacks.onToolUse?.(toolCall);
            }
        });
        const finalMessage = await stream.finalMessage();
        const response = {
            content: this.mapContent(finalMessage.content),
            stopReason: finalMessage.stop_reason ?? 'end_turn',
            usage: {
                inputTokens: finalMessage.usage.input_tokens,
                outputTokens: finalMessage.usage.output_tokens,
            },
        };
        callbacks.onDone?.(response);
        return response;
    }
    /* ─── Private helpers ──────────────────────── */
    mapContent(blocks) {
        const result = [];
        for (const block of blocks) {
            if (block.type === 'text') {
                result.push({ type: 'text', text: block.text });
            }
            else if (block.type === 'tool_use') {
                result.push({
                    type: 'tool_use',
                    id: block.id,
                    name: block.name,
                    input: block.input,
                });
            }
            // Skip thinking, redacted_thinking, and other block types
        }
        return result;
    }
}
/* ─── Backwards Compatibility ────────────────── */
/** @deprecated Use AnthropicProvider instead */
export const LLMAdapter = AnthropicProvider;
