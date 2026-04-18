import { kipConfig, type AgentConfig } from "../../agents/kip/config.js";
import { addMessage } from "../memory/conversation.js";
import { createProvider } from "../providers/index.js";
import { buildPromptString } from "./buildPrompt.js";
import { runToolLoop } from "./toolLoop.js";

const AGENTS: Record<string, AgentConfig> = {
  kip: kipConfig,
};

const provider = createProvider();

export async function runAgent(
  agentName: string,
  chatId: number,
  userName: string,
  text: string,
): Promise<string> {
  const agent = AGENTS[agentName];
  if (!agent) throw new Error(`Unknown agent: ${agentName}`);

  addMessage(chatId, { role: "user", content: `[${userName}]: ${text}` });

  const system = buildPromptString(agentName);
  return runToolLoop({ provider, agent, system, chatId, userName });
}

export function getAgent(agentName: string): AgentConfig | undefined {
  return AGENTS[agentName];
}
