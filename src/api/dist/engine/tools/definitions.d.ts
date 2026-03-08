import type { ToolDefinition } from '../llm-adapter.js';
/**
 * 읽기 전용 도구 — Ask 엔드포인트에서도 사용
 */
export declare const READ_TOOLS: ToolDefinition[];
/**
 * 쓰기 도구 — Assign 엔드포인트에서만 사용
 */
export declare const WRITE_TOOLS: ToolDefinition[];
/**
 * 디스패치 도구 — 매니저 Role에게만 제공
 */
export declare const DISPATCH_TOOL: ToolDefinition;
/**
 * Role에 따른 도구 목록 반환
 */
export declare function getToolsForRole(hasSubordinates: boolean, readOnly: boolean): ToolDefinition[];
