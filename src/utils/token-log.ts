import { appendFileSync, readFileSync, existsSync, mkdirSync } from "fs";

const LOG_FILE = "data/token-log.jsonl";

export interface TokenLogEntry {
  ts: string;
  chatId: number;
  userName: string;
  tools: string[];
  inputTokens: number;
  outputTokens: number;
  provider?: "anthropic" | "openai";
  toolMode?: "local" | "mcp";
  model?: string;
}

export function logOperation(entry: TokenLogEntry): void {
  mkdirSync("data", { recursive: true });
  appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
}

export function getRecentLogs(n = 200): TokenLogEntry[] {
  if (!existsSync(LOG_FILE)) return [];
  const lines = readFileSync(LOG_FILE, "utf-8").trim().split("\n").filter(Boolean);
  return lines.slice(-n).map((l) => JSON.parse(l)).reverse();
}
