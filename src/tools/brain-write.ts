import { Octokit } from "@octokit/rest";
import { config } from "../config.js";

const octokit = new Octokit({ auth: config.github.token });
const owner = config.github.brainOwner;
const repo = config.github.brainRepo;

const BLOCKED_PREFIXES = ["memory/sources/", "memory/sources"];

interface FileChange {
  path: string;
  content: string;
}

export async function brainWriteFiles(input: {
  branch_slug: string;
  pr_title: string;
  pr_body: string;
  files: FileChange[];
}): Promise<string> {
  // Guardrail: block writes to sources/
  for (const file of input.files) {
    if (BLOCKED_PREFIXES.some((prefix) => file.path.startsWith(prefix))) {
      return `Error: Cannot write to ${file.path} — the sources/ directory is read-only for AI agents.`;
    }
  }

  // Guardrail: wiki edits must include log.md update
  const touchesWiki = input.files.some(
    (f) => f.path.startsWith("memory/wiki/") && f.path !== "memory/wiki/log.md",
  );
  const updatesLog = input.files.some(
    (f) => f.path === "memory/wiki/log.md",
  );
  if (touchesWiki && !updatesLog) {
    return "Error: When editing wiki files, you must also include an update to memory/wiki/log.md with a log entry.";
  }

  const today = new Date().toISOString().slice(0, 10);
  const branchName = `intern/${today}-${input.branch_slug}`;

  // Get default branch SHA
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const baseSha = ref.object.sha;

  // Create branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // Commit each file
  for (const file of input.files) {
    // Check if file exists to get its SHA for updates
    let existingSha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.path,
        ref: branchName,
      });
      if (!Array.isArray(data) && data.type === "file") {
        existingSha = data.sha;
      }
    } catch {
      // File doesn't exist yet — that's fine
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.path,
      message: `intern: ${input.pr_title}`,
      content: Buffer.from(file.content).toString("base64"),
      branch: branchName,
      ...(existingSha ? { sha: existingSha } : {}),
    });
  }

  // Create PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: input.pr_title,
    body: input.pr_body + "\n\n---\n_Created by Intern bot_",
    head: branchName,
    base: defaultBranch,
  });

  return `PR created: ${pr.html_url}\nBranch: ${branchName}\nFiles changed: ${input.files.map((f) => f.path).join(", ")}`;
}
