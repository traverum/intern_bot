export type NormalizedMessage =
  | UserMessage
  | AssistantMessage
  | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: AssistantBlock[];
  model?: string;
  provider?: string;
}

export interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: string;
  isError?: boolean;
}

export type AssistantBlock =
  | { type: "text"; text: string }
  | {
      type: "toolCall";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    };

export interface NormalizedTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export type StopReason = "end_turn" | "tool_use" | "max_tokens" | "other";

export interface ProviderResponse {
  content: AssistantBlock[];
  usage: { inputTokens: number; outputTokens: number };
  stopReason: StopReason;
  model: string;
}

export interface McpServerConfig {
  url: string;
  name: string;
  authorizationToken?: string;
}

export interface CompleteParams {
  system: string;
  messages: NormalizedMessage[];
  tools: NormalizedTool[];
  mcpServers?: McpServerConfig[];
  maxTokens: number;
  model: string;
}

export interface LLMProvider {
  readonly name: "anthropic" | "openai";
  complete(params: CompleteParams): Promise<ProviderResponse>;
}

export const CACHE_BOUNDARY_MARKER = "<!-- VEYOND_CACHE_BOUNDARY -->";
