import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
} from "fs";
import { join } from "path";
import type {
  AssistantBlock,
  NormalizedMessage,
} from "../providers/types.js";

const SESSIONS_DIR = "data/sessions/kip";
const MAX_EXCHANGES = 15;
// v2: normalized format (role: user/assistant/toolResult). Pre-v2 files used
// Anthropic-native shapes and are incompatible — they're left alone on disk.
const FILE_SUFFIX = ".v2.jsonl";

function sessionPath(chatId: number): string {
  return join(SESSIONS_DIR, `${chatId}${FILE_SUFFIX}`);
}

function ensureDir(): void {
  mkdirSync(SESSIONS_DIR, { recursive: true });
}

function readAll(chatId: number): NormalizedMessage[] {
  const path = sessionPath(chatId);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  const messages: NormalizedMessage[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      const msg = extractMessage(parsed);
      if (msg) messages.push(msg);
    } catch {
      // skip malformed
    }
  }
  return messages;
}

function extractMessage(parsed: unknown): NormalizedMessage | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  const role = obj.role;
  if (role === "user") {
    if (typeof obj.content === "string") {
      return { role: "user", content: obj.content };
    }
    return null;
  }
  if (role === "assistant") {
    if (Array.isArray(obj.content)) {
      return {
        role: "assistant",
        content: obj.content as AssistantBlock[],
        model: typeof obj.model === "string" ? obj.model : undefined,
        provider: typeof obj.provider === "string" ? obj.provider : undefined,
      };
    }
    return null;
  }
  if (role === "toolResult") {
    if (
      typeof obj.toolCallId === "string" &&
      typeof obj.content === "string"
    ) {
      return {
        role: "toolResult",
        toolCallId: obj.toolCallId,
        toolName: typeof obj.toolName === "string" ? obj.toolName : "",
        content: obj.content,
        isError: obj.isError === true,
      };
    }
    return null;
  }
  return null;
}

// Trim to last N messages. Never start the window on a toolResult whose
// matching toolCall would be outside the window — that orphans the result.
function pruneWindow(messages: NormalizedMessage[]): NormalizedMessage[] {
  const maxMessages = MAX_EXCHANGES * 2;
  let window =
    messages.length > maxMessages ? messages.slice(-maxMessages) : messages;

  while (window.length > 0 && window[0].role === "toolResult") {
    window = window.slice(1);
  }

  return window;
}

export function getHistory(chatId: number): NormalizedMessage[] {
  return pruneWindow(readAll(chatId));
}

export function addMessage(
  chatId: number,
  message: NormalizedMessage,
): void {
  ensureDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...message,
  });
  appendFileSync(sessionPath(chatId), line + "\n");
}

export function resetSession(chatId: number): void {
  const path = sessionPath(chatId);
  if (!existsSync(path)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archived = join(
    SESSIONS_DIR,
    `${chatId}.${stamp}.archived${FILE_SUFFIX}`,
  );
  renameSync(path, archived);
}
