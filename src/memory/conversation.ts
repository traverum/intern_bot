import Anthropic from "@anthropic-ai/sdk";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
} from "fs";
import { join } from "path";

type Message = Anthropic.MessageParam;

const SESSIONS_DIR = "data/sessions/kip";
const MAX_EXCHANGES = 15;

function sessionPath(chatId: number): string {
  return join(SESSIONS_DIR, `${chatId}.jsonl`);
}

function ensureDir(): void {
  mkdirSync(SESSIONS_DIR, { recursive: true });
}

function readAll(chatId: number): Message[] {
  const path = sessionPath(chatId);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  const messages: Message[] = [];
  for (const line of lines) {
    try {
      const { role, content } = JSON.parse(line);
      messages.push({ role, content });
    } catch {
      // Skip malformed lines rather than crash the whole session.
    }
  }
  return messages;
}

// Trim to last N messages, but never start the window on a user message
// whose content is an array of tool_results — Anthropic's API requires
// each tool_result to follow a matching tool_use from a prior assistant turn.
function pruneWindow(messages: Message[]): Message[] {
  const maxMessages = MAX_EXCHANGES * 2;
  let window =
    messages.length > maxMessages ? messages.slice(-maxMessages) : messages;

  while (
    window.length > 0 &&
    window[0].role === "user" &&
    Array.isArray(window[0].content)
  ) {
    window = window.slice(1);
  }

  return window;
}

export function getHistory(chatId: number): Message[] {
  return pruneWindow(readAll(chatId));
}

export function addMessage(chatId: number, message: Message): void {
  ensureDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    role: message.role,
    content: message.content,
  });
  appendFileSync(sessionPath(chatId), line + "\n");
}

export function resetSession(chatId: number): void {
  const path = sessionPath(chatId);
  if (!existsSync(path)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archived = join(SESSIONS_DIR, `${chatId}.${stamp}.archived.jsonl`);
  renameSync(path, archived);
}
