import { describe, expect, it } from "bun:test";
import { LruCache } from "./lru";

describe("LruCache", () => {
  it("returns undefined for missing keys", () => {
    const cache = new LruCache<string, number>();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves values", () => {
    const cache = new LruCache<string, number>();
    cache.set("k", 42);
    expect(cache.get("k")).toBe(42);
  });

  it("overwrites existing keys", () => {
    const cache = new LruCache<string, number>();
    cache.set("k", 1);
    cache.set("k", 2);
    expect(cache.get("k")).toBe(2);
  });

  it("expires entries after TTL", async () => {
    const cache = new LruCache<string, number>(10, 30);
    cache.set("k", 1);
    expect(cache.get("k")).toBe(1);
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("k")).toBeUndefined();
  });

  it("evicts the least-recently-used entry when full", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    cache.set("c", 3);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("refreshes recency on get", () => {
    const cache = new LruCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    cache.set("c", 3);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("clear removes everything", () => {
    const cache = new LruCache<string, number>();
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("handles different key/value types", () => {
    const cache = new LruCache<number, string[]>();
    cache.set(1, ["a", "b"]);
    expect(cache.get(1)).toEqual(["a", "b"]);
  });
});
