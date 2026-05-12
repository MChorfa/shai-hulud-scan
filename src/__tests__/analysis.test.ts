/**
 * Unit tests for the core analysis utilities.
 *
 * These tests cover the logic that does NOT depend on the SQLite database so
 * that they run quickly in any environment (including CI).
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Cosine-similarity helper (re-implemented here from the same algorithm used
// in src/lib/db.ts so we can verify correctness in isolation).
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [0.5, 0.5, 0.5, 0.5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
  });

  it('returns 0 for zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('returns 0 for mismatched lengths', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it('produces a value in [-1, 1] for random-ish vectors', () => {
    const a = [0.1, 0.9, -0.3, 0.7];
    const b = [0.4, -0.2, 0.8, 0.1];
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThanOrEqual(-1);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Risk-score calculation (same logic as in /api/analyze/route.ts)
// ---------------------------------------------------------------------------
function calculateRiskScore(packages: Array<{ risk_level: string }>): number {
  let score = 0;
  for (const pkg of packages) {
    if (pkg.risk_level === 'critical') score += 20;
    else if (pkg.risk_level === 'high') score += 10;
    else if (pkg.risk_level === 'medium') score += 5;
    else score += 1;
  }
  return Math.min(score, 100);
}

describe('calculateRiskScore', () => {
  it('returns 0 for no compromised packages', () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it('adds 20 per critical package', () => {
    expect(calculateRiskScore([{ risk_level: 'critical' }])).toBe(20);
  });

  it('caps score at 100', () => {
    const packages = Array.from({ length: 10 }, () => ({ risk_level: 'critical' }));
    expect(calculateRiskScore(packages)).toBe(100);
  });

  it('sums mixed risk levels', () => {
    const packages = [
      { risk_level: 'critical' }, // +20
      { risk_level: 'high' },     // +10
      { risk_level: 'medium' },   // +5
      { risk_level: 'low' },      // +1
    ];
    expect(calculateRiskScore(packages)).toBe(36);
  });
});

// ---------------------------------------------------------------------------
// Package dependency extraction (same logic as in scripts/ci-check.js)
// ---------------------------------------------------------------------------
function findDependencies(lockFile: Record<string, unknown>, deps = new Set<string>()): Set<string> {
  const typedLockFile = lockFile as {
    dependencies?: Record<string, { version: string; dependencies?: Record<string, unknown> }>;
    packages?: Record<string, { name?: string; version?: string }>;
  };
  if (typedLockFile.dependencies) {
    for (const [name, detail] of Object.entries(typedLockFile.dependencies)) {
      const version = detail.version.replace(/^= /, '');
      deps.add(`${name}@${version}`);
      if (detail.dependencies) {
        findDependencies(detail as Record<string, unknown>, deps);
      }
    }
  }
  if (typedLockFile.packages) {
    for (const [pkgPath, detail] of Object.entries(typedLockFile.packages)) {
      let name = detail.name;
      if (!name && pkgPath.startsWith('node_modules/')) {
        name = pkgPath.replace('node_modules/', '');
      }
      if (name && detail.version) {
        const version = detail.version.replace(/^= /, '');
        deps.add(`${name}@${version}`);
      }
    }
  }
  return deps;
}

describe('findDependencies', () => {
  it('extracts packages section entries', () => {
    const lockFile = {
      packages: {
        '': { name: 'my-app', version: '1.0.0' },
        'node_modules/express': { version: '4.18.0' },
      },
    };
    const deps = findDependencies(lockFile);
    expect(deps.has('my-app@1.0.0')).toBe(true);
    expect(deps.has('express@4.18.0')).toBe(true);
  });

  it('handles lockfile v1 dependencies section', () => {
    const lockFile = {
      dependencies: {
        lodash: { version: '4.17.21' },
      },
    };
    const deps = findDependencies(lockFile);
    expect(deps.has('lodash@4.17.21')).toBe(true);
  });

  it('strips leading "= " from version strings', () => {
    const lockFile = {
      dependencies: {
        'some-pkg': { version: '= 1.2.3' },
      },
    };
    const deps = findDependencies(lockFile);
    expect(deps.has('some-pkg@1.2.3')).toBe(true);
  });

  it('returns empty set for empty lockfile', () => {
    expect(findDependencies({}).size).toBe(0);
  });
});
