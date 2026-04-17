import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { allTools } from "./tools.js";
import { getHistory, addMessage } from "../memory/conversation.js";
import { dispatchTool } from "../tools/index.js";
import { trackTokens } from "../utils/rate-limit.js";
import { logOperation } from "../utils/token-log.js";

const anthropic = new Anthropic({ apiKey: config.claude.apiKey });

const MAX_TOOL_ITERATIONS = 10;

export async function handleMessage(
  chatId: number,
  userName: string,
  text: string,
): Promise<string> {
  addMessage(chatId, { role: "user", content: `[${userName}]: ${text}` });

  let messages = getHistory(chatId);
  let iterations = 0;
  let totalInput = 0;
  let totalOutput = 0;
  const toolsUsed: string[] = [];

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: config.claude.model,
      max_tokens: config.claude.maxTokens,
      system: SYSTEM_PROMPT,
      tools: allTools,
      messages,
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;
    trackTokens(response.usage.input_tokens, response.usage.output_tokens);

    // Collect text and tool-use blocks
    const textBlocks = response.content.filter(
      (b) => b.type === "text",
    ) as Anthropic.TextBlock[];
    const toolUseBlocks = response.content.filter(
      (b) => b.type === "tool_use",
    ) as Anthropic.ToolUseBlock[];

    // No tool calls — we're done
    if (toolUseBlocks.length === 0) {
      const reply = textBlocks.map((b) => b.text).join("\n") || "...";
      addMessage(chatId, { role: "assistant", content: response.content });
      logOperation({ ts: new Date().toISOString(), chatId, userName, tools: toolsUsed, inputTokens: totalInput, outputTokens: totalOutput });
      return reply;
    }

    // Store assistant response with tool use
    addMessage(chatId, { role: "assistant", content: response.content });

    // Track tool names used this turn
    for (const t of toolUseBlocks) toolsUsed.push(t.name);

    // Execute tools and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        try {
          const result = await dispatchTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: truncateResult(result),
          };
        } catch (err) {
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          };
        }
      }),
    );

    addMessage(chatId, { role: "user", content: toolResults });
    messages = getHistory(chatId);
  }

  logOperation({ ts: new Date().toISOString(), chatId, userName, tools: toolsUsed, inputTokens: totalInput, outputTokens: totalOutput });
  return "I hit my tool-use limit for this question. Try breaking it into smaller questions.";
}

function truncateResult(result: string, maxLength = 8000): string {
  if (result.length <= maxLength) return result;
  return (
    result.slice(0, maxLength) +
    `\n\n... (truncated, ${result.length - maxLength} chars omitted)`
  );
}
