import { readFileSync } from "fs";

// Load .env file before any other imports
try {
  const envFile = readFileSync(".env", "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

// Dynamic import so config.ts sees the env vars
const { bot } = await import("./gateway/telegram.js");
const { startAdminServer } = await import("./admin.js");

console.log("Starting Veyond Crew...");

startAdminServer();

bot.start({
  onStart: (botInfo) => {
    console.log(`Kip running as @${botInfo.username}`);
  },
});

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    console.log(`Received ${signal}, shutting down...`);
    bot.stop();
    process.exit(0);
  });
}
