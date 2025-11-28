// Static database for GitHub Pages deployment
// This loads a pre-built JSON database file instead of using SQLite

interface StaticPackage {
  id: number;
  name: string;
  version: string;
  ecosystem: string;
  first_seen: string;
  risk_level: string;
  description: string | null;
  maintainer: string | null;
  download_count: number;
  embedding?: number[]; // Optional for GitHub Pages
}

let staticPackages: StaticPackage[] = [];
let isLoaded = false;

export async function loadStaticDatabase(): Promise<void> {
  if (isLoaded) return;

  try {
    // For GitHub Pages, load from a static JSON file
    const response = await fetch('/shai-hulud-scan/data/packages.json');
    if (response.ok) {
      staticPackages = await response.json();
      isLoaded = true;
      console.log(`Loaded ${staticPackages.length} packages from static database`);
    } else {
      console.error('Failed to load static database');
      staticPackages = [];
    }
  } catch (error) {
    console.error('Error loading static database:', error);
    staticPackages = [];
  }
}

// Search functions for static deployment
export async function searchPackagesStatic(query: string, limit: number = 50): Promise<StaticPackage[]> {
  await loadStaticDatabase();

  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase();
  const results = staticPackages
    .filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm))
    )
    .slice(0, limit)
    .map(pkg => ({
      ...pkg,
      relevance_score: 1.0
    }));

  return results;
}

export async function getPackagesByRiskStatic(riskLevel: string, limit: number = 100): Promise<StaticPackage[]> {
  await loadStaticDatabase();

  return staticPackages
    .filter(pkg => pkg.risk_level === riskLevel)
    .slice(0, limit);
}

export async function getPackageStatsStatic() {
  await loadStaticDatabase();

  const criticalPackages = staticPackages.filter(pkg => pkg.risk_level === 'critical');
  const highPackages = staticPackages.filter(pkg => pkg.risk_level === 'high');
  const mediumPackages = staticPackages.filter(pkg => pkg.risk_level === 'medium');
  const lowPackages = staticPackages.filter(pkg => pkg.risk_level === 'low');

  const total = staticPackages.length;

  return {
    total,
    stats: [
      { risk_level: 'critical', count: criticalPackages.length, percentage: total > 0 ? Math.round((criticalPackages.length / total) * 100) : 0 },
      { risk_level: 'high', count: highPackages.length, percentage: total > 0 ? Math.round((highPackages.length / total) * 100) : 0 },
      { risk_level: 'medium', count: mediumPackages.length, percentage: total > 0 ? Math.round((mediumPackages.length / total) * 100) : 0 },
      { risk_level: 'low', count: lowPackages.length, percentage: total > 0 ? Math.round((lowPackages.length / total) * 100) : 0 },
    ]
  };
}

// For GitHub Pages, we'll use text search instead of semantic search
export async function compositeSearchStatic(query: string, topK: number = 10) {
  const results = await searchPackagesStatic(query, topK);

  return {
    results: results.map(pkg => ({
      ...pkg,
      similarity: 0.8 // Fixed similarity score for static version
    })),
    query,
    total: results.length
  };
}
// Check a single package against the static database
export async function checkPackageStatic(name: string, version: string): Promise<StaticPackage | null> {
  await loadStaticDatabase();

  const pkg = staticPackages.find(p => p.name === name && p.version === version);
  return pkg || null;
}
