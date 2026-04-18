import { readFileSync } from "fs";
import { join } from "path";
import { CACHE_BOUNDARY_MARKER } from "../providers/types.js";

function read(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf-8").trim();
}

function assembleStable(agentName: string): string {
  const soul = read(`agents/${agentName}/SOUL.md`);
  const memory = read(`agents/${agentName}/MEMORY.md`);
  const business = read(`global_memory/BUSINESS.md`);
  const analytics = read(`global_memory/ANALYTICS_GUIDE.md`);

  return [
    soul,
    "---",
    "# Seed Memory",
    memory,
    "---",
    business,
    "---",
    analytics,
  ].join("\n\n");
}

function assembleDynamic(agentName: string): string {
  const status = read(`global_memory/STATUS.md`);
  const date = new Date().toISOString().slice(0, 10);

  return [
    status,
    "---",
    `# Runtime\n\nagent=${agentName} | channel=telegram | date=${date}`,
  ].join("\n\n");
}

export function buildPromptString(agentName: string): string {
  return `${assembleStable(agentName)}\n\n${CACHE_BOUNDARY_MARKER}\n\n${assembleDynamic(agentName)}`;
}
