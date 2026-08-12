import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, ensureSession, loadSession, saveSession } from "./session";
import { apiFetch } from "./api";
import { stubLocalStorage } from "../test-utils";

vi.mock("./api", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

const session = {
  sessionId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  token: "a".repeat(64),
  expiresAt: Date.now() + 100_000,
};

beforeEach(() => {
  stubLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session persistence", () => {
  it("round-trips a session through localStorage", () => {
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it("returns null when nothing is stored", () => {
    expect(loadSession()).toBeNull();
  });

  it("drops an expired session", () => {
    saveSession({ ...session, expiresAt: Date.now() - 1 });
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem("bayiq.session")).toBeNull();
  });

  it("returns null on corrupt storage", () => {
    localStorage.setItem("bayiq.session", "{not json");
    expect(loadSession()).toBeNull();
  });

  it("tolerates extra fields in stored session (forward-compat)", () => {
    const withExtra = { ...session, futureField: "abc" };
    localStorage.setItem("bayiq.session", JSON.stringify(withExtra));
    const loaded = loadSession();
    expect(loaded).toEqual(session);
  });

  it("tolerates a stored session missing essential fields (forward-compat)", () => {
    const minimal = { sessionId: session.sessionId, token: session.token };
    localStorage.setItem("bayiq.session", JSON.stringify(minimal));
    expect(loadSession()).toBeNull();
  });

  it("clears the stored session", () => {
    saveSession(session);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe("ensureSession", () => {
  it("reuses an existing valid session without a network call", async () => {
    saveSession(session);
    const s = await ensureSession();
    expect(s).toEqual(session);
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("mints a new session when none exists", async () => {
    mockedApiFetch.mockResolvedValue(
      new Response(JSON.stringify(session), { status: 200 }),
    );
    const s = await ensureSession();
    expect(s).toEqual(session);
    expect(mockedApiFetch).toHaveBeenCalledWith("/session", {
      method: "POST",
    });
    expect(loadSession()).toEqual(session);
  });

  it("throws when the server rejects", async () => {
    mockedApiFetch.mockResolvedValue(new Response("{}", { status: 500 }));
    await expect(ensureSession()).rejects.toThrow("session_500");
  });
});
