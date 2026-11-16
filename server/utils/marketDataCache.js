/**
 * StockWise - In-Memory Market Data Cache
 * 
 * Provides fast, thread-safe in-memory caching with automatic TTL eviction
 * to prevent external market API rate-limiting and minimize latency.
 */

class MarketDataCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Store value in cache with TTL in milliseconds (default: 60 seconds)
   */
  set(key, value, ttlMs = 60000) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieve cached item if not expired; returns null if missing or expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Checks if a valid, unexpired entry exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a single key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached market data
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get total number of active entries
   */
  get size() {
    // Clean up expired entries during count
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

export const marketCache = new MarketDataCache();
