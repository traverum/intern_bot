---
title: "Ack Reaction Pattern"
category: concept
tags: [ack, ux, reaction, grammy, telegram, phase3]
sources: [ack_reaction]
updated: 2026-04-17
---

# Ack Reaction Pattern

The UX pattern that fills the silence between receiving a message and delivering a reply. [Kip](../entities/kip.md) reacts with `👀` immediately on receipt, then removes it when the reply is sent. ([ack_reaction](../sources/ack_reaction.md))

---

## Why it exists

[Kip](../entities/kip.md) uses Claude with tool calls. Responses can take 10–20 seconds. Without feedback:

```
User sends message
    ↓
[10–20 seconds of silence — is it broken?]
    ↓
Reply arrives
```

With the ack:

```
User sends message
    ↓
👀 appears instantly (< 100ms)   ← user knows Kip is working
    ↓
Reply arrives, 👀 disappears
```

---

## grammY implementation

```typescript
bot.on("message", async (ctx) => {
  // Fire immediately — non-blocking, don't await before LLM work
  const ackPromise = ctx.react(KIP_ACK_EMOJI).catch(() => {})

  try {
    const reply = await runKip(ctx)
    await ctx.reply(reply)
  } finally {
    // Remove in finally — cleaned up even if LLM call throws
    await ackPromise
    await ctx.react("").catch(() => {})  // empty string = remove reaction
  }
})
```

### Four rules
1. **Don't await before LLM work** — fire `ctx.react()` and let it resolve in parallel with the LLM call.
2. **Remove in `finally`** — reaction is cleaned up even if the handler errors.
3. **Catch both** — `ctx.react()` can fail silently (bot lacks react permission in a group); don't let that crash the handler.
4. **`ctx.react("")`** — grammY's way to clear a reaction.

---

## Emoji source

The ack emoji comes from the agent's config, not hardcoded in the handler:

```typescript
const KIP_ACK_EMOJI = agentConfig.ackEmoji  // "👀" — defined in agents/kip/config.ts
```

When a second agent is added, it gets its own emoji from its own config. The gateway reads `config.ackEmoji` and uses it. See [Multi-Agent Design](multi_agent_design.md).

---

## OpenClaw's more robust approach

OpenClaw checks whether the ack reaction actually landed before trying to remove it — useful when bot permissions vary across group chats:

```typescript
void ackReactionPromise.then((didAck) => {
  if (!didAck) return          // don't try to remove if it never landed
  remove().catch(() => {})
})
```

The Veyond implementation can start with the simpler version (`catch(() => {})` on both sides) and adopt the `didAck` check if spurious errors appear in groups.

---

## Decision: removeAfterReply = true

The `👀` is a "working on it" signal only. Once the reply arrives, the signal has done its job. Leaving it permanently would create visual noise across chat history.

---

## Implementation status

Planned for **Phase 3** of the [Roadmap](../roadmap.md). The pattern is fully specified here — implementation is a straightforward addition to `src/gateway/telegram.ts`.

---

## Related pages
- [Kip](../entities/kip.md)
- [Agent Architecture](../concepts/agent_architecture.md)
- [Multi-Agent Design](multi_agent_design.md)
- [Roadmap](../roadmap.md)
