import { cors } from "hono/cors";
import type { Context, Next } from "hono";
import type { ApiEnv } from "../env";

/**
 * Pure CORS origin resolution. Returns the value for
 * Access-Control-Allow-Origin:
 * - no Origin header (same-origin navigations) → first allowlisted origin, or ""
 * - allowlisted origin → echo it
 * - worker's own host (SPA + API same origin) → echo it
 * - anything else → "" (browser blocks)
 */
export function resolveCorsOrigin(
  origin: string | undefined,
  requestUrl: string,
  allowlist: string[],
): string {
  if (!origin) return allowlist[0] ?? "";
  if (allowlist.includes(origin)) return origin;
  try {
    if (origin === new URL(requestUrl).origin) return origin;
  } catch {
    /* ignore */
  }
  return "";
}

/** CORS middleware; allowlist comes from the resolved ServerConfig. */
export function corsGuard(c: Context<ApiEnv>, next: Next) {
  const origins = c.get("config")?.allowedOrigins ?? [];
  return cors({
    origin: (origin) => resolveCorsOrigin(origin, c.req.url, origins),
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Correlation-Id"],
  })(c, next);
}