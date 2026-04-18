# Kip — Ack Reaction Pattern
> Learned from OpenClaw `src/channels/ack-reactions.ts` + `src/agents/identity.ts`

---

## What it is

When Kip receives a message, it immediately reacts with an emoji (👀 or Kip's identity emoji) before doing any LLM work. This tells the user "got it, working on it" during the gap between message receipt and reply.

When the reply is sent, the reaction is removed — clean, no permanent marker left on the message.

---

## Why it matters

Kip uses Opus + tool calls. Responses can take 10–20 seconds. Without the ack:

```
User sends message
    ↓
[10 seconds of silence — is it broken?]
    ↓
Reply arrives
```

With the ack:

```
User sends message
    ↓
👀 appears instantly (< 100ms)   ← user relaxes, knows Kip is working
    ↓
Reply arrives, 👀 disappears
```

---

## Implementation for Veyond Crew (grammY)

```typescript
bot.on("message", async (ctx) => {
  // 1. Ack immediately — fire and don't await so it's non-blocking
  const ackPromise = ctx.react("👀").catch(() => {}) // ignore if react fails

  try {
    // 2. Do the LLM work
    const reply = await runKip(ctx)

    // 3. Send the reply
    await ctx.reply(reply)
  } finally {
    // 4. Remove the reaction after reply is sent (or even if it errored)
    await ackPromise
    await ctx.react("").catch(() => {})  // empty string removes reaction
  }
})
```

### Key points:
- **Don't await the react before LLM work** — fire it immediately and let it resolve in parallel
- **Remove in `finally`** — reaction gets cleaned up even if the LLM call throws
- **Catch errors on both** — react API calls can fail silently (e.g. bot lacks permission), don't let that crash the handler
- **Empty string removes** — `ctx.react("")` is the grammY way to clear a reaction

---

## Kip's emoji

The reaction emoji should come from Kip's identity config, not be hardcoded:

```typescript
const KIP_ACK_EMOJI = "👀"  // or whatever emoji is in agents/kip/SOUL.md identity section

bot.on("message", async (ctx) => {
  const ackPromise = ctx.react(KIP_ACK_EMOJI).catch(() => {})
  // ...
})
```

---

## OpenClaw's approach (for reference)

OpenClaw stores the ack promise and only attempts removal after confirming the reaction actually landed:

```typescript
// Simplified from src/channels/ack-reactions.ts
function removeAckReactionAfterReply(params: {
  removeAfterReply: boolean
  ackReactionPromise: Promise<boolean> | null
  ackReactionValue: string | null
  remove: () => Promise<void>
}) {
  void params.ackReactionPromise.then((didAck) => {
    if (!didAck) return          // don't try to remove if it never landed
    params.remove().catch(() => {})
  })
}
```

The extra safety (checking `didAck` before removing) is worth having if Kip gets used in group chats where bot permissions vary.

---

## Decision: remove after reply ✅

We want `removeAfterReply: true`. The 👀 is purely a "working on it" signal — once the reply is there, the signal has done its job and should disappear. Leaving it would create visual noise across the chat history.