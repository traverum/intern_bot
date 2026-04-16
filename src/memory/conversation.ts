import Anthropic from "@anthropic-ai/sdk";

type Message = Anthropic.MessageParam;

const MAX_EXCHANGES = 15; // ~30 messages (user + assistant pairs)

const conversations = new Map<number, Message[]>();

export function getHistory(chatId: number): Message[] {
  return conversations.get(chatId) ?? [];
}

export function addMessage(chatId: number, message: Message): void {
  const history = conversations.get(chatId) ?? [];
  history.push(message);

  // Trim to sliding window — keep last N exchanges (user+assistant pairs)
  const maxMessages = MAX_EXCHANGES * 2;
  if (history.length > maxMessages) {
    history.splice(0, history.length - maxMessages);
  }

  conversations.set(chatId, history);
}
