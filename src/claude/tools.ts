import type { NormalizedTool } from "../providers/types.js";

export const posthogTools: NormalizedTool[] = [
  {
    name: "posthog_query",
    description:
      "Run a HogQL query against PostHog.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "HogQL query string, e.g. \"SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - interval 7 day\"",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "posthog_trend",
    description:
      "Get event counts over time (trend). Returns time series data for one or more events.",
    inputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          description: "Events to trend",
          items: {
            type: "object",
            properties: {
              event: { type: "string", description: "Event name" },
              name: {
                type: "string",
                description: "Display name (optional)",
              },
            },
            required: ["event"],
          },
        },
        date_from: {
          type: "string",
          description: 'Start date, e.g. "-7d", "-30d", "2025-01-01"',
        },
        date_to: {
          type: "string",
          description: "End date (optional, defaults to now)",
        },
        interval: {
          type: "string",
          enum: ["hour", "day", "week", "month"],
          description: "Aggregation interval (default: day)",
        },
      },
      required: ["events", "date_from"],
    },
  },
  {
    name: "posthog_funnel",
    description:
      "Analyze conversion between sequential steps. Shows drop-off between events.",
    inputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          description: "Funnel steps in order",
          items: {
            type: "object",
            properties: {
              event: { type: "string", description: "Event name" },
              name: {
                type: "string",
                description: "Display name (optional)",
              },
            },
            required: ["event"],
          },
        },
        date_from: {
          type: "string",
          description: 'Start date, e.g. "-7d", "-30d"',
        },
        date_to: {
          type: "string",
          description: "End date (optional)",
        },
      },
      required: ["events", "date_from"],
    },
  },
  {
    name: "posthog_event_definitions",
    description:
      "List available event definitions in PostHog. Use this FIRST to discover what events are tracked before writing queries.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional search filter for event names",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "posthog_dashboards",
    description:
      "List dashboards, or get a specific dashboard with its insights.",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_id: {
          type: "number",
          description:
            "Specific dashboard ID to retrieve. Omit to list all dashboards.",
        },
      },
      required: [],
    },
  },
  {
    name: "posthog_feature_flags",
    description: "List feature flags and their current status.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Optional search filter",
        },
      },
      required: [],
    },
  },
];

export const allTools: NormalizedTool[] = [
  ...posthogTools,
];
