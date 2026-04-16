function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  telegram: {
    botToken: required("TELEGRAM_BOT_TOKEN"),
    allowedChatIds: optional("TELEGRAM_ALLOWED_CHAT_IDS", "")
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id)),
  },
  claude: {
    apiKey: required("ANTHROPIC_API_KEY"),
    model: optional("CLAUDE_MODEL", "claude-sonnet-4-6"),
    maxTokens: parseInt(optional("CLAUDE_MAX_TOKENS", "4096"), 10),
    monthlyTokenBudget: parseInt(
      optional("CLAUDE_MONTHLY_TOKEN_BUDGET", "10000000"),
      10,
    ),
  },
  github: {
    token: required("GITHUB_TOKEN"),
    brainOwner: optional("GITHUB_BRAIN_OWNER", "traverum"),
    brainRepo: optional("GITHUB_BRAIN_REPO", "brain"),
  },
  posthog: {
    apiKey: optional("POSTHOG_API_KEY", ""),
    projectId: optional("POSTHOG_PROJECT_ID", ""),
    host: optional("POSTHOG_HOST", "https://eu.posthog.com"),
  },
} as const;

export type Config = typeof config;
