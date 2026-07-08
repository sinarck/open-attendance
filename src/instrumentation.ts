import { getPostHogServer } from "@/lib/monitoring/posthog-server";

interface RequestErrorRequest {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  path?: string;
}

interface RequestErrorContext {
  routePath: string;
  routeType: "action" | "proxy" | "render" | "route";
}

export function register() {}

export async function onRequestError(
  error: Error,
  request: RequestErrorRequest,
  context: RequestErrorContext,
) {
  const posthog = getPostHogServer();

  await posthog.captureExceptionImmediate(error, undefined, {
    headers: request.headers,
    method: request.method,
    path: request.path,
    route_path: context.routePath,
    route_type: context.routeType,
    source: "next_request_error",
  });
}
