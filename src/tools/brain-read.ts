import { Octokit } from "@octokit/rest";
import { config } from "../config.js";

const octokit = new Octokit({ auth: config.github.token });
const owner = config.github.brainOwner;
const repo = config.github.brainRepo;

export async function brainReadFile(input: {
  path: string;
}): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: input.path,
  });

  if (Array.isArray(data) || data.type !== "file") {
    return `Error: ${input.path} is not a file. Use brain_list_directory instead.`;
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return content;
}

export async function brainListDirectory(input: {
  path: string;
}): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: input.path || "",
  });

  if (!Array.isArray(data)) {
    return `Error: ${input.path} is a file, not a directory. Use brain_read_file instead.`;
  }

  const entries = data.map((entry) => {
    const icon = entry.type === "dir" ? "📁" : "📄";
    return `${icon} ${entry.name}`;
  });

  return entries.join("\n");
}

export async function brainSearch(input: {
  query: string;
}): Promise<string> {
  const { data } = await octokit.search.code({
    q: `${input.query} repo:${owner}/${repo}`,
    per_page: 10,
  });

  if (data.total_count === 0) {
    return `No results found for "${input.query}"`;
  }

  const results = data.items.map((item) => {
    return `- ${item.path} (score: ${item.score.toFixed(1)})`;
  });

  return `Found ${data.total_count} results:\n${results.join("\n")}`;
}
