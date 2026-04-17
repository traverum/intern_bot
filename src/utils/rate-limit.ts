import { config } from "../config.js";

const COOLDOWN_MS = 3000; // 3 seconds between messages per user
const lastMessageTime = new Map<number, number>();
let monthlyTokensUsed = 0;
let currentMonth = new Date().getMonth();

export function checkRateLimit(userId: number): string | null {
  // Reset monthly budget on new month
  const now = new Date();
  if (now.getMonth() !== currentMonth) {
    monthlyTokensUsed = 0;
    currentMonth = now.getMonth();
  }

  // Monthly token budget
  if (monthlyTokensUsed >= config.claude.monthlyTokenBudget) {
    return "I've hit my monthly token budget. Let Elias know if you need it increased.";
  }

  // Per-user cooldown
  const lastTime = lastMessageTime.get(userId);
  if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
    return "Easy there — give me a moment between messages.";
  }

  lastMessageTime.set(userId, Date.now());
  return null;
}

export function trackTokens(inputTokens: number, outputTokens: number): void {
  monthlyTokensUsed += inputTokens + outputTokens;
  console.log(
    `Tokens this month: ${monthlyTokensUsed.toLocaleString()} / ${config.claude.monthlyTokenBudget.toLocaleString()}`,
  );
}

export function getTokenStats() {
  return {
    used: monthlyTokensUsed,
    budget: config.claude.monthlyTokenBudget,
    month: currentMonth,
  };
}
