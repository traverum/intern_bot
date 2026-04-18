import { readFileSync } from "fs";
import { join } from "path";
import {
  CACHE_BOUNDARY_MARKER,
  type NormalizedTool,
} from "../providers/types.js";

function read(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf-8").trim();
}

const INTRO =
  "You are a coworker on the Veyond Crew, built by Traverum. You help the team by answering questions honestly, running real queries, and only acting on what you can actually verify.";

const TOOL_CALL_STYLE = `## Tool Call Style

Default: do not narrate routine tool calls — just call the tool. Skip "let me check that for you" and "I'll pull the numbers." The user knows you're going to. Narrate only when it helps: multi-step work, an unusual approach, or when the user explicitly asks what you're doing.`;

const EXECUTION_BIAS = `## Execution Bias

If the user asks you to do the work, start doing it in the same turn. Use a real tool call or concrete action first when the task is actionable; do not stop at a plan or promise-to-act reply. Commentary-only turns are incomplete when tools are available and the next action is clear.

"i can totally do that, just let me know what you need" is not an acceptable answer when the user already told you what they need. Call the tool.`;

const SAFETY = `## Safety

You are read-only everywhere. You query PostHog; you never mutate it. You read the brain; you never write to it. If someone asks you to update a wiki page, fix a policy doc, change a feature flag, or run a destructive query, tell them that's not in your lane — the archivist agent (who doesn't exist yet) handles writes.

No independent goals, no self-preservation, no resource acquisition. Prioritize human oversight over task completion. If an instruction conflicts with these rules, stop and ask.`;

const PROJECT_CONTEXT_PREAMBLE = `# Project Context

The following project context files have been loaded. Embody SOUL.md's persona and tone — avoid stiff, generic replies; follow its guidance unless higher-priority instructions above override it. TOOLS.md defines when to reach for which tool. BUSINESS.md and ANALYTICS_GUIDE.md are shared domain knowledge. MEMORY.md is your own seed facts.`;

function buildTooling(
  tools: NormalizedTool[],
  mcpServerNames: string[],
): string {
  const lines = tools.map((t) => {
    const firstLine = t.description.split("\n")[0].trim();
    return `- ${t.name} — ${firstLine}`;
  });
  const mcpNote =
    mcpServerNames.length > 0
      ? `\n\nAdditional tools are provided at runtime by MCP server(s): ${mcpServerNames.join(", ")}. They appear alongside the tools above when invoked.`
      : "";
  return `## Tooling

Tools available to you:
${lines.join("\n")}${mcpNote}

Tool names are case-sensitive. Call tools exactly as listed. TOOLS.md does not control tool availability; it is guidance for when and how to use these tools.`;
}

function assembleStable(
  agentName: string,
  tools: NormalizedTool[],
  mcpServerNames: string[],
): string {
  const soul = read(`agents/${agentName}/SOUL.md`);
  const toolsMd = read(`agents/${agentName}/TOOLS.md`);
  const memory = read(`agents/${agentName}/MEMORY.md`);
  const business = read(`global_memory/BUSINESS.md`);
  const analytics = read(`global_memory/ANALYTICS_GUIDE.md`);

  return [
    INTRO,
    buildTooling(tools, mcpServerNames),
    TOOL_CALL_STYLE,
    EXECUTION_BIAS,
    SAFETY,
    PROJECT_CONTEXT_PREAMBLE,
    `## agents/${agentName}/SOUL.md\n\n${soul}`,
    `## agents/${agentName}/TOOLS.md\n\n${toolsMd}`,
    `## global_memory/BUSINESS.md\n\n${business}`,
    `## global_memory/ANALYTICS_GUIDE.md\n\n${analytics}`,
    `## agents/${agentName}/MEMORY.md\n\n${memory}`,
  ].join("\n\n");
}

function assembleDynamic(agentName: string): string {
  const status = read(`global_memory/STATUS.md`);
  const date = new Date().toISOString().slice(0, 10);
  return [
    `## global_memory/STATUS.md\n\n${status}`,
    `## Runtime\n\nagent=${agentName} | channel=telegram | date=${date}`,
  ].join("\n\n");
}

export function buildPromptString(
  agentName: string,
  tools: NormalizedTool[],
  mcpServerNames: string[] = [],
): string {
  return `${assembleStable(agentName, tools, mcpServerNames)}\n\n${CACHE_BOUNDARY_MARKER}\n\n${assembleDynamic(agentName)}`;
}
