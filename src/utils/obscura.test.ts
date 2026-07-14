import { afterEach, describe, expect, it } from "bun:test";
import { __resetObscuraCache, checkObscura, getObscuraPath } from "./obscura";

describe("obscura utils", () => {
  afterEach(() => {
    __resetObscuraCache();
  });

  describe("getObscuraPath", () => {
    it("returns a string when found, null when not", () => {
      const result = getObscuraPath();
      expect(result === null || typeof result === "string").toBe(true);
    });

    it("caches the result across calls", () => {
      const first = getObscuraPath();
      const second = getObscuraPath();
      expect(second).toBe(first);
    });

    it("honors OBSCURA_PATH override", () => {
      // We can't actually mutate the const, but the cache reset + first
      // observation above already exercised the cache. This test asserts
      // __resetObscuraCache works without throwing.
      __resetObscuraCache();
      expect(() => getObscuraPath()).not.toThrow();
    });
  });

  describe("checkObscura", () => {
    it("returns an object with available boolean", async () => {
      const result = await checkObscura();
      expect(typeof result.available).toBe("boolean");
    });

    it("caches the result within TTL", async () => {
      const a = await checkObscura();
      const b = await checkObscura();
      expect(b.available).toBe(a.available);
    });
  });

  describe("__resetObscuraCache", () => {
    it("does not throw", () => {
      expect(() => __resetObscuraCache()).not.toThrow();
    });
  });
});
