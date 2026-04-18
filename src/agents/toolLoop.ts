import type { AgentConfig } from "../../agents/kip/config.js";
import { config } from "../config.js";
import { getHistory, addMessage } from "../memory/conversation.js";
import type { LLMProvider, NormalizedTool } from "../providers/types.js";
import { dispatchTool } from "../tools/index.js";
import { trackTokens } from "../utils/rate-limit.js";
import { logOperation } from "../utils/token-log.js";
import { allTools } from "../claude/tools.js";

const MAX_TOOL_ITERATIONS = 10;

export async function runToolLoop(args: {
  provider: LLMProvider;
  agent: AgentConfig;
  system: string;
  chatId: number;
  userName: string;
}): Promise<string> {
  const { provider, agent, system, chatId, userName } = args;

  const mcpEnabled =
    config.toolMode === "mcp" &&
    provider.name === "anthropic" &&
    agent.mcpServers.length > 0;

  const tools = selectTools(agent.localTools, mcpEnabled);
  const mcpServers = mcpEnabled ? agent.mcpServers : undefined;

  let iterations = 0;
  let totalInput = 0;
  let totalOutput = 0;
  const toolsUsed: string[] = [];

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const messages = getHistory(chatId);
    const response = await provider.complete({
      system,
      messages,
      tools,
      mcpServers,
      maxTokens: agent.maxTokens,
      model: agent.model,
    });

    totalInput += response.usage.inputTokens;
    totalOutput += response.usage.outputTokens;
    trackTokens(response.usage.inputTokens, response.usage.outputTokens);

    const textBlocks = response.content.filter((b) => b.type === "text") as {
      type: "text";
      text: string;
    }[];
    const toolCalls = response.content.filter(
      (b) => b.type === "toolCall",
    ) as {
      type: "toolCall";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }[];

    if (toolCalls.length === 0) {
      const reply = textBlocks.map((b) => b.text).join("\n") || "...";
      addMessage(chatId, {
        role: "assistant",
        content: response.content,
        model: response.model,
        provider: provider.name,
      });
      logOperation({
        ts: new Date().toISOString(),
        chatId,
        userName,
        tools: toolsUsed,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        provider: provider.name,
        toolMode: config.toolMode,
        model: response.model,
      });
      return reply;
    }

    addMessage(chatId, {
      role: "assistant",
      content: response.content,
      model: response.model,
      provider: provider.name,
    });
    for (const t of toolCalls) toolsUsed.push(t.name);

    await Promise.all(
      toolCalls.map(async (call) => {
        try {
          const result = await dispatchTool(call.name, call.arguments);
          addMessage(chatId, {
            role: "toolResult",
            toolCallId: call.id,
            toolName: call.name,
            content: truncate(result),
          });
        } catch (err) {
          addMessage(chatId, {
            role: "toolResult",
            toolCallId: call.id,
            toolName: call.name,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            isError: true,
          });
        }
      }),
    );
  }

  logOperation({
    ts: new Date().toISOString(),
    chatId,
    userName,
    tools: toolsUsed,
    inputTokens: totalInput,
    outputTokens: totalOutput,
    provider: provider.name,
    toolMode: config.toolMode,
  });
  return "I hit my tool-use limit for this question. Try breaking it into smaller questions.";
}

function selectTools(
  localToolNames: string[],
  mcpEnabled: boolean,
): NormalizedTool[] {
  const filtered = allTools.filter((t) => localToolNames.includes(t.name));
  if (!mcpEnabled) return filtered;
  // MCP provides PostHog tools — drop the local duplicates to avoid
  // confusing the model with two tools of the same concept.
  return filtered.filter((t) => !t.name.startsWith("posthog_"));
}

function truncate(result: string, maxLength = 8000): string {
  if (result.length <= maxLength) return result;
  return (
    result.slice(0, maxLength) +
    `\n\n... (truncated, ${result.length - maxLength} chars omitted)`
  );
}
