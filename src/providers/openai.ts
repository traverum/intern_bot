import OpenAI from "openai";
import {
  CACHE_BOUNDARY_MARKER,
  type AssistantBlock,
  type CompleteParams,
  type LLMProvider,
  type NormalizedMessage,
  type ProviderResponse,
  type StopReason,
} from "./types.js";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(params: CompleteParams): Promise<ProviderResponse> {
    const systemText = stripCacheBoundary(params.system);

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemText },
      ...toOpenAIMessages(params.messages),
    ];

    const tools: OpenAI.Chat.ChatCompletionTool[] = params.tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema as Record<string, unknown>,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: params.model,
      max_completion_tokens: params.maxTokens,
      messages: openaiMessages,
      tools: tools.length > 0 ? tools : undefined,
    });

    const choice = response.choices[0];
    const message = choice.message;

    const content: AssistantBlock[] = [];
    if (message.content) {
      content.push({ type: "text", text: message.content });
    }
    if (message.tool_calls) {
      for (const call of message.tool_calls) {
        if (call.type === "function") {
          content.push({
            type: "toolCall",
            id: call.id,
            name: call.function.name,
            arguments: parseArgs(call.function.arguments),
          });
        }
      }
    }

    return {
      content,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      stopReason: mapFinishReason(choice.finish_reason),
      model: response.model,
    };
  }
}

function stripCacheBoundary(system: string): string {
  return system.split(CACHE_BOUNDARY_MARKER).join("").trim();
}

function toOpenAIMessages(
  messages: NormalizedMessage[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const out: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      out.push({ role: "user", content: msg.content });
      continue;
    }
    if (msg.role === "assistant") {
      const textParts = msg.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .filter(Boolean);
      const toolCalls = msg.content
        .filter(
          (
            b,
          ): b is {
            type: "toolCall";
            id: string;
            name: string;
            arguments: Record<string, unknown>;
          } => b.type === "toolCall",
        )
        .map((b) => ({
          id: b.id,
          type: "function" as const,
          function: {
            name: b.name,
            arguments: JSON.stringify(b.arguments),
          },
        }));

      const assistantMsg: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: textParts.length > 0 ? textParts.join("\n") : null,
      };
      if (toolCalls.length > 0) {
        assistantMsg.tool_calls = toolCalls;
      }
      out.push(assistantMsg);
      continue;
    }
    // toolResult
    out.push({
      role: "tool",
      tool_call_id: msg.toolCallId,
      content: msg.isError ? `Error: ${msg.content}` : msg.content,
    });
  }
  return out;
}

function parseArgs(raw: string): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapFinishReason(reason: string | null): StopReason {
  if (reason === "stop") return "end_turn";
  if (reason === "tool_calls") return "tool_use";
  if (reason === "length") return "max_tokens";
  return "other";
}
