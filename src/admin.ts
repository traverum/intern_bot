import { createServer } from "http";
import { getTokenStats } from "./utils/rate-limit.js";
import { getRecentLogs } from "./utils/token-log.js";
import { buildPromptString } from "./agents/buildPrompt.js";
import { allTools } from "./claude/tools.js";
import { kipConfig } from "../agents/kip/config.js";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intern Bot — Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 24px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 24px; color: #555; }
    .card { background: #fff; border-radius: 10px; padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .card h2 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 16px; }
    .token-count { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .token-sub { font-size: 13px; color: #888; margin-bottom: 14px; }
    .bar-bg { background: #eee; border-radius: 99px; height: 8px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 99px; background: #4ade80; transition: width 0.4s; }
    .bar-fill.warn { background: #facc15; }
    .bar-fill.danger { background: #f87171; }
    pre { font-family: "SF Mono", "Fira Code", monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; max-height: 520px; overflow-y: auto; background: #f8f8f8; border-radius: 6px; padding: 16px; color: #333; }
    .footer { font-size: 12px; color: #bbb; text-align: right; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; color: #888; font-weight: 600; padding: 0 8px 10px 0; border-bottom: 1px solid #eee; }
    td { padding: 8px 8px 8px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .tag { display: inline-block; background: #f0f0f0; border-radius: 4px; padding: 1px 6px; font-size: 11px; margin: 1px 2px 1px 0; color: #555; }
    .tag.posthog { background: #fff3e0; color: #e65100; }
    .tag.brain { background: #e8f5e9; color: #2e7d32; }
    .num { font-variant-numeric: tabular-nums; }
    .breakdown-bar { height: 6px; border-radius: 99px; background: #e0e0e0; margin-top: 4px; }
    .breakdown-bar-fill { height: 100%; border-radius: 99px; background: #818cf8; }
  </style>
</head>
<body>
  <h1>Intern Bot — Admin</h1>

  <div class="card">
    <h2>Token Usage — This Session</h2>
    <div class="token-count" id="count">—</div>
    <div class="token-sub" id="sub">Loading...</div>
    <div class="bar-bg"><div class="bar-fill" id="bar" style="width:0%"></div></div>
  </div>

  <div class="card">
    <h2>Cost by Operation Type</h2>
    <table id="breakdown-table"><tr><td style="color:#bbb">No data yet</td></tr></table>
  </div>

  <div class="card">
    <h2>Recent Operations</h2>
    <table>
      <thead><tr><th>Time</th><th>User</th><th>Tools</th><th style="text-align:right">Tokens</th></tr></thead>
      <tbody id="log-body"><tr><td colspan="4" style="color:#bbb">No data yet</td></tr></tbody>
    </table>
  </div>

  <div class="card">
    <h2>System Prompt</h2>
    <pre id="prompt">Loading...</pre>
  </div>

  <div class="footer" id="footer"></div>

  <script>
    function tagClass(tool) {
      if (tool.startsWith('posthog')) return 'tag posthog';
      if (tool.startsWith('brain')) return 'tag brain';
      return 'tag';
    }

    function tagLabel(tool) {
      return tool.replace('posthog_', 'ph: ').replace('brain_', 'brain: ');
    }

    async function refresh() {
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/logs'),
      ]);
      const d = await statusRes.json();
      const logs = await logsRes.json();

      // Token usage
      const pct = (d.used / d.budget * 100).toFixed(1);
      document.getElementById('count').textContent = d.used.toLocaleString() + ' tokens';
      document.getElementById('sub').textContent =
        d.used.toLocaleString() + ' / ' + d.budget.toLocaleString() + ' (' + pct + '%) this month';
      const bar = document.getElementById('bar');
      bar.style.width = Math.min(pct, 100) + '%';
      bar.className = 'bar-fill' + (pct > 90 ? ' danger' : pct > 70 ? ' warn' : '');

      // Breakdown by operation type
      const totals = {};
      let grandTotal = 0;
      for (const entry of logs) {
        const total = entry.inputTokens + entry.outputTokens;
        grandTotal += total;
        const key = entry.tools.length === 0 ? '(chat only)'
          : entry.tools.some(t => t.startsWith('posthog')) && entry.tools.some(t => t.startsWith('brain')) ? 'posthog + brain'
          : entry.tools.some(t => t.startsWith('posthog')) ? 'posthog'
          : entry.tools.some(t => t.startsWith('brain')) ? 'brain'
          : entry.tools[0];
        totals[key] = (totals[key] || 0) + total;
      }
      const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
      const maxVal = sorted[0]?.[1] || 1;
      document.getElementById('breakdown-table').innerHTML = sorted.length === 0
        ? '<tr><td style="color:#bbb">No data yet</td></tr>'
        : '<thead><tr><th>Type</th><th style="text-align:right">Tokens</th><th style="text-align:right">Share</th></tr></thead>' +
          sorted.map(([k, v]) =>
            '<tr><td>' + k + '<div class="breakdown-bar"><div class="breakdown-bar-fill" style="width:' + (v/maxVal*100).toFixed(1) + '%"></div></div></td>' +
            '<td class="num" style="text-align:right">' + v.toLocaleString() + '</td>' +
            '<td class="num" style="text-align:right;color:#888">' + (v/grandTotal*100).toFixed(1) + '%</td></tr>'
          ).join('');

      // Recent ops log
      document.getElementById('log-body').innerHTML = logs.length === 0
        ? '<tr><td colspan="4" style="color:#bbb">No data yet</td></tr>'
        : logs.slice(0, 30).map(e => {
            const t = new Date(e.ts).toLocaleTimeString();
            const tools = e.tools.length === 0
              ? '<span style="color:#bbb">—</span>'
              : [...new Set(e.tools)].map(t => '<span class="' + tagClass(t) + '">' + tagLabel(t) + '</span>').join('');
            const total = (e.inputTokens + e.outputTokens).toLocaleString();
            return '<tr><td class="num" style="color:#888">' + t + '</td><td>' + e.userName + '</td><td>' + tools + '</td><td class="num" style="text-align:right">' + total + '</td></tr>';
          }).join('');

      document.getElementById('prompt').textContent = d.prompt;
      document.getElementById('footer').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    }

    refresh();
    setInterval(refresh, 30000);
  </script>
</body>
</html>`;

export function startAdminServer() {
  const port = parseInt(process.env.ADMIN_PORT ?? "3001", 10);

  const server = createServer((req, res) => {
    if (req.url === "/api/status") {
      const stats = getTokenStats();
      res.writeHead(200, { "Content-Type": "application/json" });
      const kipTools = allTools.filter((t) =>
        kipConfig.localTools.includes(t.name),
      );
      const mcpNames = kipConfig.mcpServers.map((s) => s.name);
      res.end(
        JSON.stringify({
          ...stats,
          prompt: buildPromptString("kip", kipTools, mcpNames),
        }),
      );
    } else if (req.url === "/api/logs") {
      const logs = getRecentLogs();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(logs));
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(HTML);
    }
  });

  server.listen(port, () => {
    console.log(`Admin UI running at http://localhost:${port}`);
  });
}
