import { Bot, Context } from "grammy";
import { config } from "../config.js";
import { runAgent, getAgent } from "../agents/runAgent.js";
import { checkRateLimit } from "../utils/rate-limit.js";

export function createBot(agentName: string): Bot {
  const agent = getAgent(agentName);
  if (!agent) throw new Error(`Agent not found: ${agentName}`);

  const token = process.env[agent.botTokenEnv];
  if (!token) throw new Error(`Missing bot token env: ${agent.botTokenEnv}`);

  const bot = new Bot(token);

  const botUsername = new Promise<string>((resolve) => {
    bot.api.getMe().then((me) => resolve(me.username ?? `${agentName}_bot`));
  });

  function isAllowedChat(ctx: Context): boolean {
    const chatId = ctx.chat?.id;
    if (!chatId) return false;
    if (config.telegram.allowedChatIds.length === 0) return true;
    return config.telegram.allowedChatIds.includes(chatId);
  }

  async function isMentionedOrReply(ctx: Context): Promise<boolean> {
    if (!ctx.message?.text) return false;

    if (ctx.message.reply_to_message?.from?.is_bot) {
      const me = await botUsername;
      if (ctx.message.reply_to_message.from.username === me) return true;
    }

    const me = await botUsername;
    if (ctx.message.text.includes(`@${me}`)) return true;

    if (ctx.chat?.type === "private") return true;

    return false;
  }

  bot.on("message:text", async (ctx) => {
    console.log(
      `[${agentName}] Message from chat ${ctx.chat.id} (${ctx.chat.type}${ctx.chat.type !== "private" ? `, "${ctx.chat.title}"` : ""}) by ${ctx.from?.first_name}`,
    );

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
      const response = await runAgent(agentName, chatId, userName, text);
      await sendLongMessage(ctx, response);
    } catch (err) {
      console.error(`[${agentName}] Error handling message:`, err);
      await ctx.reply("Sorry, I hit an error. Try again in a moment.");
    }
  });

  return bot;
}

async function sendLongMessage(ctx: Context, text: string) {
  const MAX_LENGTH = 4096;
  if (text.length <= MAX_LENGTH) {
    await ctx.reply(text);
    return;
  }
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
