import { HealthResponseSchema, type HealthResponse } from "@app/contracts";
import { SCHEMA_VERSION } from "@app/local-first";
import { describeRoute, resolver } from "hono-openapi";
import { createRequestContext } from "../lib/context";
import { newRouter } from "../lib/guard";

export const healthRoutes = newRouter().get(
  "/v1/health",
  describeRoute({
    summary: "Health",
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: resolver(HealthResponseSchema) } },
      },
    },
  }),
  (c) => {
    const ctx = createRequestContext(c.env.APP_ENV, c.get("correlationId"));
    const body: HealthResponse = {
      status: "ok",
      env: ctx.envName,
      schemaVersion: SCHEMA_VERSION,
      message: "BayiQ",
    };
    ctx.logger.info("health.ok", { schemaVersion: body.schemaVersion });
    return c.json(body);
  },
);
