import Anthropic from "@anthropic-ai/sdk";
import {
  CACHE_BOUNDARY_MARKER,
  type AssistantBlock,
  type CompleteParams,
  type LLMProvider,
  type NormalizedMessage,
  type ProviderResponse,
  type StopReason,
} from "./types.js";

const MCP_BETA_HEADER = "mcp-client-2025-04-04";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(params: CompleteParams): Promise<ProviderResponse> {
    const systemBlocks = splitSystemWithCacheBoundary(params.system);

    const tools: Anthropic.Tool[] = params.tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));

    const messages = toAnthropicMessages(params.messages);

    const useMcp = (params.mcpServers?.length ?? 0) > 0;

    const body: Record<string, unknown> = {
      model: params.model,
      max_tokens: params.maxTokens,
      system: systemBlocks,
      tools,
      messages,
    };

    if (useMcp) {
      body.mcp_servers = params.mcpServers!.map((s) => ({
        type: "url",
        url: s.url,
        name: s.name,
        ...(s.authorizationToken
          ? { authorization_token: s.authorizationToken }
          : {}),
      }));
    }

    const requestOptions = useMcp
      ? { headers: { "anthropic-beta": MCP_BETA_HEADER } }
      : undefined;

    const response = useMcp
      ? await (this.client.beta.messages.create as unknown as (
          b: unknown,
          o?: unknown,
        ) => Promise<Anthropic.Message>)(body, requestOptions)
      : await this.client.messages.create(
          body as unknown as Anthropic.MessageCreateParamsNonStreaming,
        );

    return {
      content: response.content.map(fromAnthropicBlock).filter(nonEmpty),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      stopReason: mapStopReason(response.stop_reason),
      model: response.model,
    };
  }
}

function splitSystemWithCacheBoundary(
  system: string,
): Anthropic.TextBlockParam[] {
  const idx = system.indexOf(CACHE_BOUNDARY_MARKER);
  if (idx === -1) {
    return [{ type: "text", text: system }];
  }
  const stable = system.slice(0, idx).trim();
  const dynamic = system.slice(idx + CACHE_BOUNDARY_MARKER.length).trim();
  const blocks: Anthropic.TextBlockParam[] = [];
  if (stable) {
    blocks.push({
      type: "text",
      text: stable,
      cache_control: { type: "ephemeral" },
    });
  }
  if (dynamic) {
    blocks.push({ type: "text", text: dynamic });
  }
  return blocks;
}

// Normalized → Anthropic. Consecutive toolResult messages are merged into a
// single user message with multiple tool_result blocks (Anthropic requires
// tool results to follow the assistant message that called them, in one user turn).
function toAnthropicMessages(
  messages: NormalizedMessage[],
): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];

    if (msg.role === "user") {
      out.push({ role: "user", content: msg.content });
      i++;
      continue;
    }

    if (msg.role === "assistant") {
      out.push({
        role: "assistant",
        content: msg.content.map((b) => {
          if (b.type === "text") {
            return { type: "text" as const, text: b.text };
          }
          return {
            type: "tool_use" as const,
            id: b.id,
            name: b.name,
            input: b.arguments,
          };
        }),
      });
      i++;
      continue;
    }

    // toolResult — batch consecutive ones
    const batch: Anthropic.ToolResultBlockParam[] = [];
    while (i < messages.length && messages[i].role === "toolResult") {
      const r = messages[i] as Extract<
        NormalizedMessage,
        { role: "toolResult" }
      >;
      batch.push({
        type: "tool_result",
        tool_use_id: r.toolCallId,
        content: r.content,
        ...(r.isError ? { is_error: true } : {}),
      });
      i++;
    }
    out.push({ role: "user", content: batch });
  }
  return out;
}

function fromAnthropicBlock(
  block: Anthropic.ContentBlock,
): AssistantBlock | null {
  if (block.type === "text") {
    return { type: "text", text: block.text };
  }
  if (block.type === "tool_use") {
    return {
      type: "toolCall",
      id: block.id,
      name: block.name,
      arguments: (block.input as Record<string, unknown>) ?? {},
    };
  }
  // Skip thinking, server_tool_use, mcp_tool_use, etc. — those don't map to
  // our normalized loop. MCP tool uses are surfaced by the SDK as regular
  // tool_use blocks when we pass mcp_servers, so we don't need special handling.
  return null;
}

function nonEmpty<T>(x: T | null): x is T {
  return x !== null;
}

function mapStopReason(reason: string | null): StopReason {
  if (reason === "end_turn") return "end_turn";
  if (reason === "tool_use") return "tool_use";
  if (reason === "max_tokens") return "max_tokens";
  return "other";
}
