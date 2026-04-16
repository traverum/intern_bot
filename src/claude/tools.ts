import Anthropic from "@anthropic-ai/sdk";

type ToolDef = Anthropic.Tool;

export const brainReadTools: ToolDef[] = [
  {
    name: "brain_read_file",
    description:
      "Read the contents of a file from the brain (knowledge base). Use this after brain_search to read specific files.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            'File path relative to repo root, e.g. "memory/wiki/cancellation-policy.md"',
        },
      },
      required: ["path"],
    },
  },
  {
    name: "brain_list_directory",
    description:
      "List files and subdirectories in a brain directory. Use to explore the knowledge base structure.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            'Directory path relative to repo root, e.g. "memory/wiki" or "" for root',
        },
      },
      required: ["path"],
    },
  },
  {
    name: "brain_search",
    description:
      "Full-text search across the brain repo. Use this FIRST to find relevant files before reading them.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
      },
      required: ["query"],
    },
  },
];

export const brainWriteTools: ToolDef[] = [
  {
    name: "brain_write_files",
    description:
      "Create or update files in the brain via a pull request. Creates a branch, commits changes, and opens a PR. Cannot write to sources/ directory. When editing wiki files, include an update to memory/wiki/log.md.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_slug: {
          type: "string",
          description:
            'Short slug for the branch name (will be prefixed with intern/YYYY-MM-DD-). E.g. "update-cancellation-policy"',
        },
        pr_title: {
          type: "string",
          description: "Pull request title",
        },
        pr_body: {
          type: "string",
          description: "Pull request description",
        },
        files: {
          type: "array",
          description: "Files to create or update",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path relative to repo root",
              },
              content: {
                type: "string",
                description: "Full file content",
              },
            },
            required: ["path", "content"],
          },
        },
      },
      required: ["branch_slug", "pr_title", "pr_body", "files"],
    },
  },
];

export const posthogTools: ToolDef[] = [
  {
    name: "posthog_query",
    description:
      "Run a HogQL query against PostHog. Use posthog_event_definitions first to discover available events and properties.",
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
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
    input_schema: {
      type: "object" as const,
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

export const allTools: ToolDef[] = [
  ...brainReadTools,
  ...brainWriteTools,
  ...posthogTools,
];
