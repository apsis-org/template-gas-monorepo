import { describe, expect, it } from "vitest";
import { buildGreeting } from "./greeting";

describe("buildGreeting", () => {
  it("includes the name and the date", () => {
    expect(buildGreeting("Alice", "2026/01/01 09:00:00")).toBe(
      "Hello, Alice! (2026/01/01 09:00:00)",
    );
  });
});
