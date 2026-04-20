import { config } from "../../src/config.js";
import type { AgentConfig } from "../kip/config.js";

const posthogMcp =
  config.posthog.mcpAuthToken && config.posthog.mcpUrl
    ? [
        {
          name: "posthog",
          url: config.posthog.mcpUrl,
          authorizationToken: config.posthog.mcpAuthToken,
        },
      ]
    : [];

export const pixelConfig: AgentConfig = {
  name: "pixel",
  displayName: "Pixel",
  botTokenEnv: "PIXEL_BOT_TOKEN",
  model: config.llm.model,
  maxTokens: config.llm.maxTokens,
  ackEmoji: "📊",
  localTools: [],
  mcpServers: posthogMcp,
  toolMode: "mcp",
};
