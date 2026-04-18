import { brainReadFile, brainListDirectory, brainSearch } from "./brain-read.js";
import {
  posthogQuery,
  posthogTrend,
  posthogFunnel,
  posthogEventDefinitions,
  posthogDashboards,
  posthogFeatureFlags,
} from "./posthog.js";

type ToolHandler = (input: Record<string, unknown>) => Promise<string>;

const registry: Record<string, ToolHandler> = {
  brain_read_file: (input) =>
    brainReadFile(input as { path: string }),
  brain_list_directory: (input) =>
    brainListDirectory(input as { path: string }),
  brain_search: (input) =>
    brainSearch(input as { query: string }),
  posthog_query: (input) =>
    posthogQuery(input as { query: string }),
  posthog_trend: (input) =>
    posthogTrend(
      input as {
        events: { event: string; name?: string }[];
        date_from: string;
        date_to?: string;
        interval?: string;
      },
    ),
  posthog_funnel: (input) =>
    posthogFunnel(
      input as {
        events: { event: string; name?: string }[];
        date_from: string;
        date_to?: string;
      },
    ),
  posthog_event_definitions: (input) =>
    posthogEventDefinitions(input as { search?: string; limit?: number }),
  posthog_dashboards: (input) =>
    posthogDashboards(input as { dashboard_id?: number }),
  posthog_feature_flags: (input) =>
    posthogFeatureFlags(input as { search?: string }),
};

export async function dispatchTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  const handler = registry[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return handler(input);
}
