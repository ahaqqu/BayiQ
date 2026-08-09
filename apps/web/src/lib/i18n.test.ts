import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMessages, t, type Messages } from "./i18n";

const localeFiles = import.meta.glob("../../public/locales/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Messages>;

const readLocale = (locale: string): Messages =>
  localeFiles[`../../public/locales/${locale}.json`] ?? {};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("locale parity", () => {
  it("id and en have identical key sets", () => {
    const id = readLocale("id");
    const en = readLocale("en");
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
  });

  it("every key has a non-empty value in both locales", () => {
    const id = readLocale("id");
    const en = readLocale("en");
    for (const key of Object.keys(id)) {
      expect(id[key]).not.toBe("");
      expect(en[key]).not.toBe("");
    }
  });
});

describe("loadMessages", () => {
  it("fetches the locale JSON from public/locales", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ hello: "Halo" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const messages = await loadMessages("id");
    expect(messages.hello).toBe("Halo");
    expect(fetchMock).toHaveBeenCalledWith("/locales/id.json");
  });

  it("throws on a failed fetch", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(loadMessages("en")).rejects.toThrow("locale_404");
  });
});

describe("t", () => {
  it("returns the message for a known key", () => {
    expect(t({ save: "Simpan" }, "save")).toBe("Simpan");
  });

  it("falls back to the key for an unknown key", () => {
    expect(t({}, "missingKey")).toBe("missingKey");
  });
});
