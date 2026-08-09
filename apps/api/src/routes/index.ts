import type { Hono } from "hono";
import type { ApiEnv } from "../env";
import { registerDocRoutes } from "./docs";
import { healthRoutes } from "./health";
import { sessionRoutes } from "./session";
import { syncRoutes } from "./sync";

/** Mounts every route module, then the doc routes that introspect them. */
export function registerRoutes(api: Hono<ApiEnv>): void {
  api.route("/", healthRoutes);
  api.route("/", sessionRoutes);
  api.route("/", syncRoutes);
  registerDocRoutes(api);
}
