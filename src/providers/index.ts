import { config } from "../config.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import type { LLMProvider } from "./types.js";

export function createProvider(): LLMProvider {
  if (config.llm.provider === "anthropic") {
    if (!config.llm.anthropicKey) {
      throw new Error(
        "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set",
      );
    }
    return new AnthropicProvider(config.llm.anthropicKey);
  }
  if (config.llm.provider === "openai") {
    if (!config.llm.openaiKey) {
      throw new Error("LLM_PROVIDER=openai but OPENAI_API_KEY is not set");
    }
    if (config.toolMode === "mcp") {
      throw new Error(
        "TOOL_MODE=mcp requires LLM_PROVIDER=anthropic. OpenAI does not support Anthropic MCP connectors.",
      );
    }
    return new OpenAIProvider(config.llm.openaiKey);
  }
  throw new Error(`Unknown LLM_PROVIDER: ${config.llm.provider}`);
}

export type {
  LLMProvider,
  NormalizedMessage,
  NormalizedTool,
  AssistantBlock,
  McpServerConfig,
  ProviderResponse,
} from "./types.js";
