function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const provider = optional("LLM_PROVIDER", "anthropic");
if (provider !== "anthropic" && provider !== "openai") {
  throw new Error(
    `Invalid LLM_PROVIDER: ${provider}. Must be "anthropic" or "openai".`,
  );
}

const toolMode = optional("TOOL_MODE", "local");
if (toolMode !== "local" && toolMode !== "mcp") {
  throw new Error(
    `Invalid TOOL_MODE: ${toolMode}. Must be "local" or "mcp".`,
  );
}

const defaultModel =
  provider === "openai" ? "gpt-5" : "claude-sonnet-4-6";

export const config = {
  telegram: {
    botToken: required("TELEGRAM_BOT_TOKEN"),
    allowedChatIds: optional("TELEGRAM_ALLOWED_CHAT_IDS", "")
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id)),
  },
  llm: {
    provider: provider as "anthropic" | "openai",
    model: optional("LLM_MODEL", defaultModel),
    maxTokens: parseInt(optional("LLM_MAX_TOKENS", "4096"), 10),
    monthlyTokenBudget: parseInt(
      optional("LLM_MONTHLY_TOKEN_BUDGET", "10000000"),
      10,
    ),
    anthropicKey: optional("ANTHROPIC_API_KEY", ""),
    openaiKey: optional("OPENAI_API_KEY", ""),
  },
  toolMode: toolMode as "local" | "mcp",
  posthog: {
    apiKey: optional("POSTHOG_API_KEY", ""),
    projectId: optional("POSTHOG_PROJECT_ID", ""),
    host: optional("POSTHOG_HOST", "https://eu.posthog.com"),
    mcpUrl: optional("POSTHOG_MCP_URL", "https://mcp.posthog.com/mcp"),
    mcpAuthToken: optional("POSTHOG_MCP_AUTH_TOKEN", ""),
  },
} as const;

export type Config = typeof config;
