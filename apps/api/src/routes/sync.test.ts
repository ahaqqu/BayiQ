import { beforeEach, describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "@app/local-first";
import { createApi } from "../app";
import { createTestDatabase } from "../test-utils/memory-d1";

const child = {
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  name: "Aisha",
  dateOfBirth: "2026-03-09",
  sex: "female",
  updatedAt: 100,
  deleted: false,
};

const record = {
  recordId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
  childId: child.childId,
  doseId: "hepb-birth",
  givenDate: "2026-08-09",
  brand: "Engerix-B",
  note: "",
  updatedAt: 100,
  deleted: false,
};

const envelope = {
  schemaVersion: SCHEMA_VERSION,
  clientVersion: "0.1.0",
  children: [child],
  records: [record],
};

describe("POST /v1/sync", () => {
  let api: ReturnType<typeof createApi>;
  let db: ReturnType<typeof createTestDatabase>;
  let token: string;

  beforeEach(async () => {
    db = createTestDatabase();
    api = createApi();
    const res = await api.request("/v1/session", { method: "POST" }, { DB: db, ASSETS: { fetch } });
    token = ((await res.json()) as { token: string }).token;
  });

  const env = () => ({ DB: db, ASSETS: { fetch } });

  it("round-trips a push and pull", async () => {
    const push = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      },
      env(),
    );
    expect(push.status).toBe(200);
    const pushed = (await push.json()) as {
      children: { name: string }[];
      records: { doseId: string }[];
      serverNow: number;
    };
    expect(pushed.children).toHaveLength(1);
    expect(pushed.records).toHaveLength(1);
    expect(pushed.serverNow).toBeGreaterThan(0);

    const pull = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...envelope, children: [], records: [] }),
      },
      env(),
    );
    const pulled = (await pull.json()) as {
      children: { name: string }[];
      records: { doseId: string }[];
    };
    expect(pulled.children[0]?.name).toBe("Aisha");
    expect(pulled.records[0]?.doseId).toBe("hepb-birth");
  });

  it("merges a newer client write over the stored snapshot", async () => {
    await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      },
      env(),
    );
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...envelope,
          children: [{ ...child, name: "Aisha Updated", updatedAt: 200 }],
          records: [],
        }),
      },
      env(),
    );
    const body = (await res.json()) as {
      children: { name: string }[];
    };
    expect(body.children[0]?.name).toBe("Aisha Updated");
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...envelope, children: [{ ...child, childId: "nope" }] }),
      },
      env(),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a missing token with 401 before validation", async () => {
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...envelope, children: [{ ...child, name: "" }] }),
      },
      env(),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a schema mismatch with 409", async () => {
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...envelope, schemaVersion: 99 }),
      },
      env(),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      serverSchemaVersion: number;
    };
    expect(body.error).toBe("schema_mismatch");
    expect(body.serverSchemaVersion).toBe(SCHEMA_VERSION);
  });

  it("rejects an unknown token with 401", async () => {
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: "Bearer bogus-token", "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      },
      env(),
    );
    expect(res.status).toBe(401);
  });

  it("accepts payload-stripped tombstones and propagates the delete", async () => {
    await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      },
      env(),
    );
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...envelope,
          children: [],
          records: [
            {
              recordId: record.recordId,
              childId: record.childId,
              doseId: "",
              givenDate: "",
              updatedAt: 200,
              deleted: true,
            },
          ],
        }),
      },
      env(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { records: { recordId: string }[] };
    expect(body.records).toEqual([]);
  });

  it("accepts live rows without the deleted key (store shape)", async () => {
    const { deleted: _omit, ...liveChild } = child;
    const res = await api.request(
      "/v1/sync",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...envelope, children: [liveChild], records: [] }),
      },
      env(),
    );
    expect(res.status).toBe(200);
  });
});
