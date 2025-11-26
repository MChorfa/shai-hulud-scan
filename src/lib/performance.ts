// Performance monitoring utilities
interface MetricEntry {
  duration: number;
  timestamp: number;
}

interface PerformanceStats {
  count: number;
  avg: string;
  min: string;
  max: string;
  p95: string;
  lastMeasurement: number;
}

export class PerformanceMonitor {
  private static metrics = new Map<string, MetricEntry[]>();

  static async measure<T>(
    operation: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    // Store metric
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push({
      duration,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements per operation
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > 100) {
      measurements.shift();
    }

    console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
    return result;
  }

  static getStats(operation: string): PerformanceStats | null {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return null;

    const durations = measurements.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

    return {
      count: measurements.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p95: p95.toFixed(2),
      lastMeasurement: measurements[measurements.length - 1]?.timestamp
    };
  }

  static getAllStats(): Record<string, PerformanceStats | null> {
    const stats: Record<string, PerformanceStats | null> = {};
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation);
    }
    return stats;
  }

  static clear(): void {
    this.metrics.clear();
  }
}

// Request rate limiter with performance tracking
interface RateLimitStats {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validTimestamps = timestamps.filter(t => t > windowStart);
    this.requests.set(identifier, validTimestamps);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    return true;
  }

  getStats(): Record<string, RateLimitStats> {
    const stats: Record<string, RateLimitStats> = {};
    const now = Date.now();
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => t > now - this.windowMs);
      stats[identifier] = {
        count: recent.length,
        resetTime: Math.max(...recent, now) + this.windowMs
      };
    }
    
    return stats;
  }

  clear(): void {
    this.requests.clear();
  }
}
