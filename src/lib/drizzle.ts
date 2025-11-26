import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { packages } from './schema';
import { eq, like, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { searchCache } from './cache';
import { dbOptimizer } from './db-optimizer';

// Database connection
let db: ReturnType<typeof drizzle> | null = null;

export async function initializeDatabase() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'data', 'shai-hulud.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);

  // Apply database optimizations
  dbOptimizer.initialize(sqlite);

  db = drizzle(sqlite);

  // Create tables if they don't exist
  await createTables();
  
  // Create optimized indexes
  await dbOptimizer.createIndexes();

  return db;
}

async function createTables() {
  const database = db;
  if (!database) throw new Error('Database not initialized');

  // Create packages table
  await database.run(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      ecosystem TEXT DEFAULT 'npm',
      first_seen TEXT DEFAULT CURRENT_TIMESTAMP,
      risk_level TEXT DEFAULT 'high',
      description TEXT,
      maintainer TEXT,
      download_count INTEGER DEFAULT 0,
      embedding BLOB,
      UNIQUE(name, version)
    )
  `);

  // Create FTS table for better search
  await database.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS packages_fts USING fts5(
      name, 
      version, 
      description, 
      maintainer,
      content='packages',
      content_rowid='id'
    )
  `);

  // Create triggers for FTS
  await database.run(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_insert AFTER INSERT ON packages
    BEGIN
      INSERT INTO packages_fts(rowid, name, version, description, maintainer)
      VALUES (new.id, new.name, new.version, new.description, new.maintainer);
    END
  `);

  await database.run(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_delete AFTER DELETE ON packages
    BEGIN
      INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
      VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
    END
  `);

  await database.run(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_update AFTER UPDATE ON packages
    BEGIN
      INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
      VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
      INSERT INTO packages_fts(rowid, name, version, description, maintainer)
      VALUES (new.id, new.name, new.version, new.description, new.maintainer);
    END
  `);
}

// Type-safe search function with caching
export async function searchPackages(query: string, limit: number = 50) {
  // Input validation and sanitization
  const searchTerm = query.trim();
  
  // Security checks
  if (!searchTerm) return [];
  if (searchTerm.length > 100) return [];
  if (searchTerm.includes('--') || searchTerm.includes('/*') || searchTerm.includes('*/')) {
    return [];
  }

  // Validate limit
  const searchLimit = Math.min(Math.max(limit, 1), 100);

  // Check cache first
  const cacheKey = `${searchTerm}:${searchLimit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for search: ${searchTerm}`);
    return cached;
  }

  await initializeDatabase();
  const database = db!; // Use non-null assertion after initialization
  
  const results = await database
    .select({
      id: packages.id,
      name: packages.name,
      version: packages.version,
      riskLevel: packages.riskLevel,
      description: packages.description,
      maintainer: packages.maintainer,
    })
    .from(packages)
    .where(
      or(
        like(packages.name, `%${searchTerm}%`),
        like(packages.description, `%${searchTerm}%`)
      )
    )
    .limit(searchLimit);

  // Add relevance score
  const finalResults = results.map((pkg) => ({
    ...pkg,
    relevance_score: 1.0,
  }));

  // Cache the results
  searchCache.set(cacheKey, finalResults);
  console.log(`Cached search results for: ${searchTerm}`);

  return finalResults;
}

// Get packages by risk level
export async function getPackagesByRisk(riskLevel: string, limit: number = 100) {
  await initializeDatabase();
  const database = db!; // Use non-null assertion after initialization

  const searchLimit = Math.min(Math.max(limit, 1), 1000); // Increased max to 1000

  return await database
    .select()
    .from(packages)
    .where(eq(packages.riskLevel, riskLevel))
    .limit(searchLimit);
}

// Insert packages (for data import)
export async function insertPackage(packageData: typeof packages.$inferInsert) {
  await initializeDatabase();
  const database = db!; // Use non-null assertion after initialization

  return await database.insert(packages).values(packageData).onConflictDoNothing();
}

// Get package by exact name and version
export async function getPackageByNameAndVersion(name: string, version: string) {
  await initializeDatabase();
  const database = db!; // Use non-null assertion after initialization

  return await database
    .select()
    .from(packages)
    .where(and(eq(packages.name, name), eq(packages.version, version)))
    .limit(1);
}

// Import missing 'or' operator
import { or } from 'drizzle-orm';
