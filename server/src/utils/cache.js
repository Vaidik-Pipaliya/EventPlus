/**
 * Simple in-memory cache with TTL (Time To Live).
 */
export class MemoryCache {
  constructor(defaultTtlMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const eventCache = new MemoryCache(5 * 60 * 1000); // 5 minutes TTL
