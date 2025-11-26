// Simple in-memory cache with TTL
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Define specific types for our caches
interface SearchResult {
  id: number;
  name: string;
  version: string;
  riskLevel: string | null;
  description: string | null;
  maintainer: string | null;
  relevance_score: number;
}

interface PackageStats {
  total: number;
  stats: Array<{
    risk_level: string;
    count: number;
    percentage: number;
  }>;
}

// Export typed singleton instances
export const searchCache = new Cache<SearchResult[]>(2 * 60 * 1000); // 2 minutes for search
export const statsCache = new Cache<PackageStats>(5 * 60 * 1000); // 5 minutes for stats

// Auto-cleanup every 10 minutes
setInterval(() => {
  searchCache.cleanup();
  statsCache.cleanup();
}, 10 * 60 * 1000);
