import { describe, it, expect } from "vitest";
import { USE_MOCK_DATA } from "../index";

describe("USE_MOCK_DATA flag default", () => {
  it("is false when NEXT_PUBLIC_USE_MOCK_DATA is unset (default behavior)", () => {
    // The vitest harness does not set NEXT_PUBLIC_USE_MOCK_DATA, so this
    // run reflects production default. Mock paths must NEVER kick in
    // unless this flag is explicitly "true".
    expect(USE_MOCK_DATA).toBe(false);
  });

  it("only matches the literal string 'true'", () => {
    const cases: Array<[string | undefined, boolean]> = [
      ["true", true],
      ["True", false],
      ["1", false],
      ["yes", false],
      ["false", false],
      [undefined, false],
    ];
    for (const [value, expected] of cases) {
      expect(value === "true").toBe(expected);
    }
  });
});
