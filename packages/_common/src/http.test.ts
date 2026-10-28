import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJsonOrThrow } from "./http";

const stubFetch = (code: number, body: string) => {
  const fetch = vi.fn(() => ({
    getResponseCode: () => code,
    getContentText: () => body,
  }));
  vi.stubGlobal("UrlFetchApp", { fetch });
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJsonOrThrow", () => {
  it("returns parsed JSON on 200", () => {
    stubFetch(200, '{"a":1}');
    expect(fetchJsonOrThrow<{ a: number }>("https://x")).toEqual({ a: 1 });
  });
  it("calls fetch with muteHttpExceptions set to true", () => {
    const fetch = stubFetch(200, "{}");
    fetchJsonOrThrow("https://x", { method: "post" });
    expect(fetch).toHaveBeenCalledWith("https://x", {
      method: "post",
      muteHttpExceptions: true,
    });
  });
  it("throws with the status and body on non-200", () => {
    stubFetch(404, "not found");
    expect(() => fetchJsonOrThrow("https://x")).toThrow("HTTP 404: not found");
  });
  it("truncates the error body to the first 300 characters", () => {
    stubFetch(500, "a".repeat(400));
    expect(() => fetchJsonOrThrow("https://x")).toThrow(
      `HTTP 500: ${"a".repeat(300)}`,
    );
    try {
      fetchJsonOrThrow("https://x");
    } catch (e) {
      expect((e as Error).message).toHaveLength("HTTP 500: ".length + 300);
    }
  });
  it("throws on 200 when the body is not JSON", () => {
    stubFetch(200, "<html>");
    expect(() => fetchJsonOrThrow("https://x")).toThrow();
  });
});
