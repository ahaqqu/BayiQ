import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCHEMA_VERSION } from "@app/local-first";
import { SyncRequestSchema } from "@app/contracts";
import * as v from "valibot";
import { pushPull } from "./sync";
import { apiFetch } from "./api";
import { saveSession } from "./session";
import { BayiQStore } from "./store";
import { stubIndexedDB, stubLocalStorage } from "../test-utils";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

const state = {
  schemaVersion: SCHEMA_VERSION,
  children: [
    {
      childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
      name: "Aisha",
      dateOfBirth: "2026-03-09",
      updatedAt: 100,
      deleted: false,
    },
  ],
  records: [],
  clockFloor: 50,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  mockedApiFetch.mockReset();
});

describe("pushPull", () => {
  it("sends the envelope and returns the merged state with a raised floor", async () => {
    mockedApiFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          serverNow: 200,
          children: state.children,
          records: [],
        }),
        { status: 200 },
      ),
    );
    const next = await pushPull(state, "tok");
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/sync",
      expect.objectContaining({
        method: "POST",
        token: "tok",
      }),
    );
    expect(next.clockFloor).toBeGreaterThanOrEqual(200);
    expect(next.children).toEqual(state.children);
  });

  it("round-trips real store rows (live + tombstone) through the wire contract", async () => {
    vi.useFakeTimers();
    try {
      stubIndexedDB();
      const store = await BayiQStore.create();
      const childRow = await store.upsertChild({
        name: "Aisha",
        dateOfBirth: "2026-03-09",
      });
      const rec = await store.upsertRecord({
        childId: childRow.childId,
        doseId: "hepb-birth",
        givenDate: "2026-08-09",
      });
      vi.advanceTimersByTime(1);
      await store.deleteRecord(rec.recordId);

      let sentBody = "";
      mockedApiFetch.mockImplementation(async (_url, init) => {
        sentBody = String(init?.body);
        return new Response(
          JSON.stringify({
            schemaVersion: SCHEMA_VERSION,
            serverNow: Date.now(),
            children: [],
            records: [],
          }),
          { status: 200 },
        );
      });

      await pushPull(store.getSnapshot(), "tok");
      const parsed = v.parse(SyncRequestSchema, JSON.parse(sentBody));
      expect(parsed.children).toHaveLength(1);
      expect(parsed.records).toHaveLength(1);
      expect(parsed.records[0]?.deleted).toBe(true);
      expect(parsed.records[0]?.doseId).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the session and re-mints one on 401, then retries", async () => {
    stubLocalStorage();
    saveSession({
      sessionId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
      token: "a".repeat(64),
      expiresAt: Date.now() + 100_000,
    });
    mockedApiFetch
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sessionId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
            token: "b".repeat(64),
            expiresAt: Date.now() + 100_000,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            schemaVersion: SCHEMA_VERSION,
            serverNow: Date.now(),
            children: [],
            records: [],
          }),
          { status: 200 },
        ),
      );
    const next = await pushPull(state, "expired-token");
    expect(mockedApiFetch).toHaveBeenCalledTimes(3);
    expect(mockedApiFetch.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ token: "b".repeat(64) }),
    );
    expect(next.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("throws a coded error on schema mismatch", async () => {
    mockedApiFetch.mockResolvedValue(new Response("{}", { status: 409 }));
    await expect(pushPull(state, "tok")).rejects.toMatchObject({
      code: "schema_mismatch",
    });
  });

  it("throws on other failures", async () => {
    mockedApiFetch.mockResolvedValue(new Response("{}", { status: 500 }));
    await expect(pushPull(state, "tok")).rejects.toThrow("sync_500");
  });
});
