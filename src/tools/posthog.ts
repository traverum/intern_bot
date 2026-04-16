import { config } from "../config.js";

const { apiKey, projectId, host } = config.posthog;

async function posthogApi(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${host}/api/projects/${projectId}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API ${res.status}: ${text}`);
  }

  return res.json();
}

export async function posthogQuery(input: {
  query: string;
}): Promise<string> {
  const data = await posthogApi("POST", "/query/", {
    query: {
      kind: "HogQLQuery",
      query: input.query,
    },
  });
  return JSON.stringify(data, null, 2);
}

export async function posthogTrend(input: {
  events: { event: string; name?: string }[];
  date_from: string;
  date_to?: string;
  interval?: string;
}): Promise<string> {
  const data = await posthogApi("POST", "/query/", {
    query: {
      kind: "TrendsQuery",
      series: input.events.map((e) => ({
        kind: "EventsNode",
        event: e.event,
        name: e.name ?? e.event,
      })),
      dateRange: {
        date_from: input.date_from,
        ...(input.date_to ? { date_to: input.date_to } : {}),
      },
      interval: input.interval ?? "day",
    },
  });
  return JSON.stringify(data, null, 2);
}

export async function posthogFunnel(input: {
  events: { event: string; name?: string }[];
  date_from: string;
  date_to?: string;
}): Promise<string> {
  const data = await posthogApi("POST", "/query/", {
    query: {
      kind: "FunnelsQuery",
      series: input.events.map((e) => ({
        kind: "EventsNode",
        event: e.event,
        name: e.name ?? e.event,
      })),
      dateRange: {
        date_from: input.date_from,
        ...(input.date_to ? { date_to: input.date_to } : {}),
      },
    },
  });
  return JSON.stringify(data, null, 2);
}

export async function posthogEventDefinitions(input: {
  search?: string;
  limit?: number;
}): Promise<string> {
  const params = new URLSearchParams();
  if (input.search) params.set("search", input.search);
  params.set("limit", String(input.limit ?? 50));

  const data = await posthogApi("GET", `/event_definitions/?${params}`);
  return JSON.stringify(data, null, 2);
}

export async function posthogDashboards(input: {
  dashboard_id?: number;
}): Promise<string> {
  const path = input.dashboard_id
    ? `/dashboards/${input.dashboard_id}/`
    : "/dashboards/";
  const data = await posthogApi("GET", path);
  return JSON.stringify(data, null, 2);
}

export async function posthogFeatureFlags(input: {
  search?: string;
}): Promise<string> {
  const params = new URLSearchParams();
  if (input.search) params.set("search", input.search);
  const data = await posthogApi("GET", `/feature_flags/?${params}`);
  return JSON.stringify(data, null, 2);
}
