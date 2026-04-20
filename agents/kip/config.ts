import { config } from "../../src/config.js";
import type { McpServerConfig } from "../../src/providers/types.js";

export interface AgentConfig {
  name: string;
  displayName: string;
  botTokenEnv: string;
  model: string;
  maxTokens: number;
  ackEmoji: string;
  localTools: string[];
  mcpServers: McpServerConfig[];
  /** If set, overrides the global TOOL_MODE env var for this agent. */
  toolMode?: "local" | "mcp";
}

// PostHog MCP — only used when TOOL_MODE=mcp (and LLM_PROVIDER=anthropic).
// Populate POSTHOG_MCP_AUTH_TOKEN in .env to enable.
const posthogMcp: McpServerConfig[] =
  config.posthog.mcpAuthToken && config.posthog.mcpUrl
    ? [
        {
          name: "posthog",
          url: config.posthog.mcpUrl,
          authorizationToken: config.posthog.mcpAuthToken,
        },
      ]
    : [];

export const kipConfig: AgentConfig = {
  name: "kip",
  displayName: "Kip",
  botTokenEnv: "TELEGRAM_BOT_TOKEN",
  model: config.llm.model,
  maxTokens: config.llm.maxTokens,
  ackEmoji: "👀",
  localTools: [
    "brain_read_file",
    "brain_list_directory",
    "brain_search",
    "posthog_query",
    "posthog_trend",
    "posthog_funnel",
    "posthog_event_definitions",
    "posthog_dashboards",
    "posthog_feature_flags",
  ],
  mcpServers: posthogMcp,
};
