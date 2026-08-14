import { SessionResponseSchema } from "@app/contracts";
import { describeRoute, resolver } from "hono-openapi";
import { createSession } from "../lib/auth";
import { newRouter, requireDb } from "../lib/guard";

export const sessionRoutes = newRouter().post(
  "/v1/session",
  describeRoute({
    summary: "Create anonymous session",
    responses: {
      200: {
        description: "Session",
        content: { "application/json": { schema: resolver(SessionResponseSchema) } },
      },
      429: { description: "Rate limited (too many requests from this IP)" },
    },
  }),
  async (c) => {
    return c.json(await createSession(requireDb(c.env)));
  },
);
