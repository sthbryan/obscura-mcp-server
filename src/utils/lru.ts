/**
 * Tiny LRU cache.
 *
 * Used by the native search/query code paths to avoid re-hitting DuckDuckGo
 * for repeated identical requests inside a short TTL window.
 */

interface Entry<V> {
  value: V;
  expires: number;
}

export class LruCache<K, V> {
  private readonly store = new Map<K, Entry<V>>();
  private readonly timers = new Map<K, NodeJS.Timeout>();

  constructor(
    private readonly maxSize: number = 128,
    private readonly ttlMs: number = 5 * 60_000
  ) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) {
      this.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.delete(oldestKey);
    }

    const expires = Date.now() + this.ttlMs;
    this.store.set(key, { value, expires });

    const oldTimer = this.timers.get(key);
    if (oldTimer) clearTimeout(oldTimer);
    const timer = setTimeout(() => this.delete(key), this.ttlMs);
    timer.unref?.();
    this.timers.set(key, timer);
  }

  private delete(key: K): void {
    this.store.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  clear(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.store.clear();
    this.timers.clear();
  }
}
