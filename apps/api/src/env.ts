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

/** Resolved server config, set once by `applyMiddleware` from bindings. */
export type ServerConfig = {
  envName: string;
  allowedOrigins: string[];
};

/** Hono generics for the whole API: bindings + request-scoped variables. */
export type ApiEnv = {
  Bindings: WorkerBindings;
  Variables: {
    correlationId: string;
    config: ServerConfig;
    authed: Authed;
  };
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
    return [];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
