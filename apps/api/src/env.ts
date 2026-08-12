import type { DatabaseStore, D1Like } from "@app/infra";
import type { R2Bucket } from "./cf-types";

export type AppEnvName = "development" | "staging" | "production";

export type WorkerBindings = {
  ASSETS: { fetch: typeof fetch };
  APP_ENV?: string;
  DB?: D1Like;
  BUCKET?: R2Bucket;
  ALLOWED_ORIGINS?: string;
  SENTRY_DSN?: string;
};

/** Resolved per-request identity, set by `authGuard` before guarded routes run. */
export type Authed = { db: DatabaseStore; sessionId: string };

/** Hono generics for the whole API: bindings + request-scoped variables. */
export type ApiEnv = {
  Bindings: WorkerBindings;
  Variables: { correlationId: string; authed: Authed };
};

export type { R2Bucket };

export function resolveEnvName(raw: string | undefined): AppEnvName {
  if (raw === "staging" || raw === "production" || raw === "development") {
    return raw;
  }
  return "development";
}

export function allowedOrigins(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") {
    return ["http://localhost:8787", "http://127.0.0.1:8787"];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
