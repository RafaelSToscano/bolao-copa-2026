import { describe, it, expect, beforeEach, vi } from "vitest";
import { withCache, __resetMemoryCacheForTests } from "../memoryCache";

describe("withCache", () => {
  beforeEach(() => {
    __resetMemoryCacheForTests();
    vi.useRealTimers();
  });

  it("calls loader once on first call and returns its value", async () => {
    const loader = vi.fn(async () => 42);
    const result = await withCache("k", 10, loader);
    expect(result).toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("returns cached value within TTL without calling loader again", async () => {
    const loader = vi.fn(async () => Math.random());
    const a = await withCache("k", 10, loader);
    const b = await withCache("k", 10, loader);
    expect(a).toBe(b);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("re-runs loader after TTL expires", async () => {
    vi.useFakeTimers();
    const loader = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");

    const first = await withCache("k", 1, loader);
    expect(first).toBe("v1");

    vi.advanceTimersByTime(1500);

    const second = await withCache("k", 1, loader);
    expect(second).toBe("v2");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent misses into a single loader call", async () => {
    let resolveLoader: (v: string) => void = () => {};
    const loaderPromise = new Promise<string>((res) => {
      resolveLoader = res;
    });
    const loader = vi.fn(() => loaderPromise);

    const p1 = withCache("k", 10, loader);
    const p2 = withCache("k", 10, loader);
    const p3 = withCache("k", 10, loader);

    resolveLoader("shared");
    const [a, b, c] = await Promise.all([p1, p2, p3]);
    expect(a).toBe("shared");
    expect(b).toBe("shared");
    expect(c).toBe("shared");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("isolates cache by key", async () => {
    const aLoader = vi.fn(async () => "A");
    const bLoader = vi.fn(async () => "B");
    expect(await withCache("a", 10, aLoader)).toBe("A");
    expect(await withCache("b", 10, bLoader)).toBe("B");
    expect(aLoader).toHaveBeenCalledTimes(1);
    expect(bLoader).toHaveBeenCalledTimes(1);
  });
});
