/** Role definition from role.yaml */
export interface Role {
  id: string;
  name: string;
  level: 'c-level' | 'team-lead' | 'member';
  reports_to: string;
  persona: string;
  authority: {
    autonomous: string[];
    needs_approval: string[];
  };
  knowledge: {
    reads: string[];
    writes: string[];
  };
  reports: {
    daily: string;
    weekly: string;
  };
}

/** Chat message */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Tool definition for LLM function calling */
export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** Tool call from LLM response */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Tool execution result */
export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** LLM response */
export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  inputTokens: number;
  outputTokens: number;
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
}

/** Agent event for logging */
export interface AgentEvent {
  timestamp: string;
  sessionId: string;
  roleId: string;
  type: 'task_start' | 'llm_call' | 'tool_call' | 'tool_result' | 'task_end' | 'error';
  data: Record<string, unknown>;
}

/** Company context for prompt assembly */
export interface CompanyInfo {
  name: string;
  root: string;
}
