import { SyncRequestSchema, SyncResponseSchema } from "@app/contracts";
import { SCHEMA_VERSION } from "@app/local-first";
import { describeRoute, resolver, validator } from "hono-openapi";
import { authGuard, newRouter } from "../lib/guard";
import { syncSnapshot } from "../lib/sync-repo";

export const syncRoutes = newRouter().post(
  "/v1/sync",
  authGuard,
  describeRoute({
    summary: "Sync children and records",
    responses: {
      200: {
        description: "Merged",
        content: { "application/json": { schema: resolver(SyncResponseSchema) } },
      },
      401: { description: "Unauthorized" },
      409: { description: "Schema mismatch or sync conflict" },
    },
  }),
  validator("json", SyncRequestSchema),
  async (c) => {
    const { db, sessionId } = c.get("authed");
    const body = c.req.valid("json");
    if (body.schemaVersion !== SCHEMA_VERSION) {
      return c.json(
        {
          error: "schema_mismatch",
          serverSchemaVersion: SCHEMA_VERSION,
          clientSchemaVersion: body.schemaVersion,
        },
        409,
      );
    }
    const merged = await syncSnapshot(db, sessionId, body);
    return c.json({
      schemaVersion: SCHEMA_VERSION,
      serverNow: Date.now(),
      children: merged.children,
      records: merged.records,
    });
  },
);
