---
title: "Kip — Ack Reaction Pattern"
category: source
tags: [ack, reaction, ux, grammy, telegram, phase3]
sources: [ack_reaction]
updated: 2026-04-17
---

# Kip — Ack Reaction Pattern

**File:** `raw/ack_reaction.md`
**Date ingested:** 2026-04-17
**Origin:** Learned from OpenClaw `src/channels/ack-reactions.ts` + `src/agents/identity.ts`

---

## What this document is

Implementation spec for the `👀` ack reaction — the UX pattern that fills the 10–20 second silence while Kip processes a message. Includes the grammY code pattern, the OpenClaw reference approach, and the `removeAfterReply: true` decision.

---

## Key claims and extracts

### The problem
Kip uses tool calls. Responses can take 10–20 seconds. Without feedback, users can't tell if the bot is working or broken.

### The solution (grammY implementation)
```typescript
bot.on("message", async (ctx) => {
  const ackPromise = ctx.react("👀").catch(() => {})  // fire immediately, non-blocking
  try {
    const reply = await runKip(ctx)
    await ctx.reply(reply)
  } finally {
    await ackPromise
    await ctx.react("").catch(() => {})  // empty string removes the reaction
  }
})
```

Four rules:
1. Don't `await` the react before LLM work — fire and let it resolve in parallel.
2. Remove in `finally` — cleaned up even if the LLM call throws.
3. Catch errors on both — react API can fail silently (permissions); don't crash the handler.
4. `ctx.react("")` is the grammY way to clear a reaction.

### OpenClaw's more robust approach
Stores the ack promise and only removes if the reaction actually landed (checking `didAck`). Useful in group chats where bot permissions vary:
```typescript
void params.ackReactionPromise.then((didAck) => {
  if (!didAck) return
  params.remove().catch(() => {})
})
```

### The emoji source
Ack emoji should come from the agent's identity config, not be hardcoded:
```typescript
const KIP_ACK_EMOJI = "👀"  // from agents/kip/config.ts ackEmoji field
```

### Decision: removeAfterReply: true
The `👀` is purely a "working on it" signal. Once the reply arrives, it should disappear. Leaving it creates permanent visual noise across chat history.

---

## Pages updated by this source

- [Ack Reaction](../concepts/ack_reaction.md) — created
- [Kip](../entities/kip.md) — ack implementation detail added
- [Roadmap](../roadmap.md) — Phase 3 ack task now has implementation detail
