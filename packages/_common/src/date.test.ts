import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDaysYmd, addDaysYmdUtc, formatYmd, parseYmd } from "./date";

const pad = (n: number) => String(n).padStart(2, "0");

beforeEach(() => {
  // Mock formatDate: UTC uses UTC fields, anything else uses local fields, as yyyy-MM-dd
  vi.stubGlobal("Utilities", {
    formatDate: (d: Date, tz: string) =>
      tz === "UTC"
        ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
        : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  });
  vi.stubGlobal("Session", { getScriptTimeZone: () => "Asia/Tokyo" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseYmd", () => {
  it("parses hyphenated dates", () => {
    const d = parseYmd("2024-03-05");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 2, 5]);
    expect(d.getHours()).toBe(0);
  });
  it("parses YYYYMMDD without hyphens", () => {
    const d = parseYmd("20241231");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([
      2024, 11, 31,
    ]);
  });
});

describe("formatYmd", () => {
  it("passes yyyy-MM-dd and the time zone to Utilities.formatDate", () => {
    const spy = vi.fn(() => "x");
    vi.stubGlobal("Utilities", { formatDate: spy });
    const d = new Date(0);
    expect(formatYmd(d, "Asia/Tokyo")).toBe("x");
    expect(spy).toHaveBeenCalledWith(d, "Asia/Tokyo", "yyyy-MM-dd");
  });
});

describe("addDaysYmdUtc", () => {
  it("adds days", () => {
    expect(addDaysYmdUtc("2024-01-01", 1)).toBe("2024-01-02");
  });
  it("crosses month and year boundaries", () => {
    expect(addDaysYmdUtc("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDaysYmdUtc("2024-12-31", 1)).toBe("2025-01-01");
  });
  it("handles February 29 in leap years", () => {
    expect(addDaysYmdUtc("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDaysYmdUtc("2023-02-28", 1)).toBe("2023-03-01");
  });
  it("handles negative numbers and zero", () => {
    expect(addDaysYmdUtc("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDaysYmdUtc("2024-03-01", 0)).toBe("2024-03-01");
  });
});

describe("addDaysYmd", () => {
  it("adds days and formats in the script time zone", () => {
    const spy = vi.fn(
      (d: Date, _tz: string) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    );
    vi.stubGlobal("Utilities", { formatDate: spy });
    expect(addDaysYmd("2024-02-28", 2)).toBe("2024-03-01");
    expect(spy.mock.calls[0]?.[1]).toBe("Asia/Tokyo");
  });
  it("goes back across a year boundary", () => {
    expect(addDaysYmd("2025-01-01", -1)).toBe("2024-12-31");
  });
});
