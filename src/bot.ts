import { Bot, Context } from "grammy";
import { config } from "./config.js";
import { handleMessage } from "./claude/client.js";
import { checkRateLimit } from "./utils/rate-limit.js";

export const bot = new Bot(config.telegram.botToken);

const botUsername = new Promise<string>((resolve) => {
  bot.api.getMe().then((me) => resolve(me.username ?? "intern_bot"));
});

function isAllowedChat(ctx: Context): boolean {
  const chatId = ctx.chat?.id;
  if (!chatId) return false;
  // Allow all chats when no IDs configured (setup mode)
  if (config.telegram.allowedChatIds.length === 0) return true;
  return config.telegram.allowedChatIds.includes(chatId);
}

async function isMentionedOrReply(ctx: Context): Promise<boolean> {
  if (!ctx.message?.text) return false;

  // Direct reply to the bot
  if (ctx.message.reply_to_message?.from?.is_bot) {
    const me = await botUsername;
    if (ctx.message.reply_to_message.from.username === me) return true;
  }

  // @mention
  const me = await botUsername;
  if (ctx.message.text.includes(`@${me}`)) return true;

  // Private chat (DM)
  if (ctx.chat?.type === "private") return true;

  return false;
}

bot.on("message:text", async (ctx) => {
  console.log(`Message from chat ${ctx.chat.id} (${ctx.chat.type}${ctx.chat.type !== "private" ? `, "${ctx.chat.title}"` : ""}) by ${ctx.from?.first_name}`);

  if (!isAllowedChat(ctx)) {
    console.log(`  → Ignored (unauthorized chat)`);
    return;
  }

  if (!(await isMentionedOrReply(ctx))) return;

  const chatId = ctx.chat.id;
  const userName = ctx.from?.first_name ?? "User";
  const me = await botUsername;
  const text = ctx.message.text.replace(`@${me}`, "").trim();

  if (!text) return;

  const rateLimitMsg = checkRateLimit(ctx.from?.id ?? 0);
  if (rateLimitMsg) {
    await ctx.reply(rateLimitMsg);
    return;
  }

  try {
    await ctx.replyWithChatAction("typing");
    const response = await handleMessage(chatId, userName, text);
    await sendLongMessage(ctx, response);
  } catch (err) {
    console.error("Error handling message:", err);
    await ctx.reply("Sorry, I hit an error. Try again in a moment.");
  }
});

async function sendLongMessage(ctx: Context, text: string) {
  const MAX_LENGTH = 4096;
  if (text.length <= MAX_LENGTH) {
    await ctx.reply(text);
    return;
  }
  // Split on newlines, respecting Telegram's limit
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_LENGTH) {
      await ctx.reply(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", MAX_LENGTH);
    if (splitAt === -1 || splitAt < MAX_LENGTH / 2) splitAt = MAX_LENGTH;
    await ctx.reply(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
}
