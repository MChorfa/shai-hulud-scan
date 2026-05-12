import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

export async function initializeDatabase() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "shai-hulud.db");

  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable SQLite optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = 1000000");
  db.pragma("temp_store = memory");

  // Create packages table with embedding support
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      ecosystem TEXT DEFAULT 'npm',
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      risk_level TEXT DEFAULT 'high',
      description TEXT,
      maintainer TEXT,
      download_count INTEGER DEFAULT 0,
      embedding BLOB,
      campaign TEXT DEFAULT 'shai-hulud-2',
      UNIQUE(name, version)
    )
  `);

  // Create virtual table for FTS (Full-Text Search)
  db.exec(`
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
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_insert AFTER INSERT ON packages
    BEGIN
      INSERT INTO packages_fts(rowid, name, version, description, maintainer)
      VALUES (new.id, new.name, new.version, new.description, new.maintainer);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_delete AFTER DELETE ON packages
    BEGIN
      INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
      VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS packages_fts_update AFTER UPDATE ON packages
    BEGIN
      INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
      VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
      INSERT INTO packages_fts(rowid, name, version, description, maintainer)
      VALUES (new.id, new.name, new.version, new.description, new.maintainer);
    END
  `);

  // Create iocs table for multi-IOC detection
  db.exec(`
    CREATE TABLE IF NOT EXISTS iocs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      campaign TEXT DEFAULT 'mini-shai-hulud',
      description TEXT,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, value)
    )
  `);

  // Create virtual table for IOC FTS
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS iocs_fts USING fts5(
      type,
      value,
      description,
      content='iocs',
      content_rowid='id'
    )
  `);

  // Create IOC FTS triggers
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS iocs_fts_insert AFTER INSERT ON iocs
    BEGIN
      INSERT INTO iocs_fts(rowid, type, value, description)
      VALUES (new.id, new.type, new.value, new.description);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS iocs_fts_delete AFTER DELETE ON iocs
    BEGIN
      INSERT INTO iocs_fts(iocs_fts, rowid, type, value, description)
      VALUES ('delete', old.id, old.type, old.value, old.description);
    END
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS iocs_fts_update AFTER UPDATE ON iocs
    BEGIN
      INSERT INTO iocs_fts(iocs_fts, rowid, type, value, description)
      VALUES ('delete', old.id, old.type, old.value, old.description);
      INSERT INTO iocs_fts(rowid, type, value, description)
      VALUES (new.id, new.type, new.value, new.description);
    END
  `);

  // Load initial data from CSVs
  loadPackageData(
    "shai-hulud-2-packages.csv",
    "shai-hulud-2",
    "Compromised package in Shai-Hulud 2.0 supply chain attack",
  );
  loadPackageData(
    "mini-shai-hulud-packages.csv",
    "mini-shai-hulud",
    "Compromised package in Mini Shai-Hulud supply chain attack",
  );
  loadIOCData();

  return db;
}

async function loadPackageData(
  csvFilename: string,
  campaign: string,
  description: string,
) {
  const csvPath = path.join(process.cwd(), "data", csvFilename);

  if (!fs.existsSync(csvPath)) {
    console.log(
      `CSV file ${csvFilename} not found, skipping initial data load`,
    );
    return;
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").slice(1); // Skip header

  const stmt = db!.prepare(`
    INSERT OR IGNORE INTO packages (name, version, risk_level, description, campaign)
    VALUES (?, ?, 'critical', ?, ?)
  `);

  let inserted = 0;
  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line
      .split(",")
      .map((field) => field.trim().replace(/^"|"$/g, ""));
    const name = parts[0];
    const version = parts[1] || "";

    if (name) {
      try {
        stmt.run(name, version, description, campaign);
        inserted++;
      } catch (error) {
        console.error(`Error inserting package ${name}:`, error);
      }
    }
  }

  console.log(
    `Package data loaded from ${csvFilename}: ${inserted} packages (${campaign})`,
  );
}

async function loadIOCData() {
  const csvPath = path.join(process.cwd(), "data", "mini-shai-hulud-iocs.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("IOC CSV file not found, skipping IOC data load");
    return;
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").slice(1); // Skip header

  const stmt = db!.prepare(`
    INSERT OR IGNORE INTO iocs (type, value, campaign, description)
    VALUES (?, ?, 'mini-shai-hulud', ?)
  `);

  let inserted = 0;
  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse CSV: type,value,description (handle commas in description by splitting on first two commas)
    const firstComma = line.indexOf(",");
    if (firstComma === -1) continue;
    const secondComma = line.indexOf(",", firstComma + 1);
    if (secondComma === -1) continue;

    const type = line.slice(0, firstComma).trim().replace(/^"|"$/g, "");
    const value = line
      .slice(firstComma + 1, secondComma)
      .trim()
      .replace(/^"|"$/g, "");
    const description = line
      .slice(secondComma + 1)
      .trim()
      .replace(/^"|"$/g, "");

    if (type && value) {
      try {
        stmt.run(type, value, description);
        inserted++;
      } catch (error) {
        console.error(`Error inserting IOC ${type}:${value}:`, error);
      }
    }
  }

  console.log(`IOC data loaded: ${inserted} indicators`);
}

export async function searchPackages(
  query: string,
  limit = 50,
): Promise<
  Array<{
    id: number;
    name: string;
    version: string;
    risk_level?: string;
    description?: string;
    relevance_score?: number;
  }>
> {
  if (!db) await initializeDatabase();

  // Input validation and sanitization
  const searchTerm = query.trim();

  // Security checks
  if (!searchTerm) return [];
  if (searchTerm.length > 100) return []; // Prevent overly long queries
  if (
    searchTerm.includes("--") ||
    searchTerm.includes("/*") ||
    searchTerm.includes("*/")
  ) {
    return []; // Basic SQL injection attempt detection
  }

  // Use simple LIKE search to avoid FTS issues
  const likeTerm = `%${searchTerm}%`;

  // Validate limit
  const searchLimit = Math.min(Math.max(limit, 1), 100); // Between 1 and 100

  const stmt = db!.prepare(`
    SELECT DISTINCT p.*, 1.0 as relevance_score
    FROM packages p
    WHERE p.name LIKE ? OR p.description LIKE ?
    ORDER BY 
      CASE WHEN p.name LIKE ? THEN 1 ELSE 2 END,
      relevance_score
    LIMIT ?
  `);

  return stmt.all(likeTerm, likeTerm, searchTerm, searchLimit) as Array<{
    id: number;
    name: string;
    version: string;
    risk_level?: string;
    description?: string;
    relevance_score?: number;
  }>;
}

export async function searchPackagesBM25(
  query: string,
  limit = 50,
): Promise<
  Array<{
    id: number;
    name: string;
    version: string;
    risk_level?: string;
    description?: string;
    maintainer?: string;
    bm25_score: number;
  }>
> {
  if (!db) await initializeDatabase();

  const searchTerm = query.trim();
  if (!searchTerm) return [];

  // Sanitize for FTS5 (remove special chars that might break syntax)
  // FTS5 allowed chars: alphanumeric, underscore, etc.
  // We'll wrap in quotes for phrase search or just clean it up.
  // For simplicity, let's just escape double quotes and use the query as is if possible,
  // or better, treat it as a simple token search.
  const sanitizedQuery = searchTerm.replace(/"/g, '""');

  // FTS5 MATCH query with BM25 ranking
  // Note: SQLite bm25() returns a value <= 0. Closer to 0 is better.
  const stmt = db!.prepare(`
    SELECT 
      p.id, p.name, p.version, p.risk_level, p.description, p.maintainer,
      bm25(packages_fts) as bm25_score
    FROM packages_fts fts
    JOIN packages p ON p.id = fts.rowid
    WHERE packages_fts MATCH ?
    ORDER BY bm25(packages_fts) DESC
    LIMIT ?
  `);

  try {
    return stmt.all(sanitizedQuery, limit) as Array<{
      id: number;
      name: string;
      version: string;
      risk_level?: string;
      description?: string;
      maintainer?: string;
      bm25_score: number;
    }>;
  } catch (error) {
    console.error("FTS5 search error:", error);
    return [];
  }
}

export async function getPackagesByRisk(
  riskLevel: string,
  limit: number = 100,
) {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT * FROM packages 
    WHERE risk_level = ?
    ORDER BY name
    LIMIT ?
  `);

  return stmt.all(riskLevel, limit);
}

export async function getPackageStats() {
  if (!db) await initializeDatabase();

  const statsStmt = db!.prepare(`
    SELECT 
      risk_level,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM packages), 2) as percentage
    FROM packages 
    GROUP BY risk_level
    ORDER BY count DESC
  `);

  const campaignStmt = db!.prepare(`
    SELECT 
      campaign,
      COUNT(*) as count
    FROM packages 
    GROUP BY campaign
    ORDER BY count DESC
  `);

  const totalStmt = db!.prepare("SELECT COUNT(*) as total FROM packages");

  return {
    stats: statsStmt.all() as Array<{
      risk_level: string;
      count: number;
      percentage: number;
    }>,
    campaigns: campaignStmt.all() as Array<{ campaign: string; count: number }>,
    total: (totalStmt.get() as { total: number }).total,
  };
}

export async function getIOCStats() {
  if (!db) await initializeDatabase();

  const typeStmt = db!.prepare(`
    SELECT 
      type,
      COUNT(*) as count
    FROM iocs 
    GROUP BY type
    ORDER BY count DESC
  `);

  const totalStmt = db!.prepare("SELECT COUNT(*) as total FROM iocs");

  return {
    types: typeStmt.all() as Array<{ type: string; count: number }>,
    total: (totalStmt.get() as { total: number }).total,
  };
}

export async function getRecentPackages(limit: number = 10) {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT * FROM packages 
    ORDER BY first_seen DESC 
    LIMIT ?
  `);

  return stmt.all(limit);
}

export async function savePackageEmbedding(
  id: number,
  embedding: number[],
): Promise<void> {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    UPDATE packages 
    SET embedding = ? 
    WHERE id = ?
  `);

  // Convert number array to buffer for storage
  const buffer = Buffer.from(new Float32Array(embedding).buffer);
  stmt.run(buffer, id);
}

export async function getPackagesWithEmbeddings(): Promise<
  Array<{
    id: number;
    name: string;
    version: string;
    risk_level?: string;
    description?: string;
    embedding?: number[];
  }>
> {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT id, name, version, risk_level, description, embedding
    FROM packages 
    WHERE embedding IS NOT NULL
    ORDER BY name
  `);

  const results = stmt.all() as Array<{
    id: number;
    name: string;
    version: string;
    risk_level?: string;
    description?: string;
    embedding: Buffer;
  }>;

  // Convert buffers back to number arrays
  return results.map((row) => ({
    ...row,
    embedding: row.embedding
      ? Array.from(new Float32Array(row.embedding.buffer))
      : undefined,
  }));
}

export async function semanticSearchPackages(
  query: string,
  embeddings: Array<{ id: number; embedding: number[] }>,
  topK: number = 10,
): Promise<
  Array<{
    id: number;
    name: string;
    version: string;
    description?: string;
    risk_level?: string;
    similarity: number;
  }>
> {
  if (!db) await initializeDatabase();

  if (!query || embeddings.length === 0) {
    return [];
  }

  // Get packages by IDs
  const ids = embeddings.map((e) => e.id);
  const placeholders = ids.map(() => "?").join(",");

  const stmt = db!.prepare(`
    SELECT id, name, version, description, risk_level 
    FROM packages 
    WHERE id IN (${placeholders})
  `);

  const packages = stmt.all(...ids) as Array<{
    id: number;
    name: string;
    version: string;
    description?: string;
    risk_level?: string;
  }>;

  // Combine with similarity scores
  return packages
    .map((pkg) => {
      const embedding = embeddings.find((e) => e.id === pkg.id);
      return {
        ...pkg,
        similarity: embedding ? cosineSimilarity() : 0,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

function cosineSimilarity(): number {
  // This is a simplified similarity calculation
  // In a real implementation, you'd generate an embedding for the query and calculate actual cosine similarity
  return Math.random() * 0.5 + 0.5; // Placeholder for demo
}

export async function getPackagesWithoutEmbeddings(limit: number = 50): Promise<
  Array<{
    id: number;
    name: string;
    version: string;
    description?: string;
  }>
> {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT id, name, version, description 
    FROM packages 
    WHERE embedding IS NULL 
    LIMIT ?
  `);

  return stmt.all(limit) as Array<{
    id: number;
    name: string;
    version: string;
    description?: string;
  }>;
}

export async function checkPackage(
  name: string,
  version: string,
): Promise<{
  name: string;
  version: string;
  risk_level: string;
  description: string;
  campaign: string;
} | null> {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT name, version, risk_level, description, campaign
    FROM packages
    WHERE name = ? AND version = ?
  `);

  return stmt.get(name, version) as {
    name: string;
    version: string;
    risk_level: string;
    description: string;
    campaign: string;
  } | null;
}

export async function checkPackageByName(name: string): Promise<
  Array<{
    name: string;
    version: string;
    risk_level: string;
    description: string;
    campaign: string;
  }>
> {
  if (!db) await initializeDatabase();

  const stmt = db!.prepare(`
    SELECT name, version, risk_level, description, campaign
    FROM packages
    WHERE name = ?
  `);

  return stmt.all(name) as Array<{
    name: string;
    version: string;
    risk_level: string;
    description: string;
    campaign: string;
  }>;
}

export async function searchIOCs(
  query: string,
  type?: string,
  limit = 50,
): Promise<
  Array<{
    id: number;
    type: string;
    value: string;
    description: string;
    campaign: string;
  }>
> {
  if (!db) await initializeDatabase();

  const searchTerm = query.trim();
  if (!searchTerm) return [];
  if (searchTerm.length > 100) return [];
  if (
    searchTerm.includes("--") ||
    searchTerm.includes("/*") ||
    searchTerm.includes("*/")
  ) {
    return [];
  }

  const likeTerm = `%${searchTerm}%`;
  const searchLimit = Math.min(Math.max(limit, 1), 100);

  if (type) {
    const stmt = db!.prepare(`
      SELECT id, type, value, description, campaign
      FROM iocs
      WHERE type = ? AND (value LIKE ? OR description LIKE ?)
      LIMIT ?
    `);
    return stmt.all(type, likeTerm, likeTerm, searchLimit) as Array<{
      id: number;
      type: string;
      value: string;
      description: string;
      campaign: string;
    }>;
  }

  const stmt = db!.prepare(`
    SELECT id, type, value, description, campaign
    FROM iocs
    WHERE value LIKE ? OR description LIKE ?
    LIMIT ?
  `);

  return stmt.all(likeTerm, likeTerm, searchLimit) as Array<{
    id: number;
    type: string;
    value: string;
    description: string;
    campaign: string;
  }>;
}

export async function checkIOC(
  value: string,
  type?: string,
): Promise<
  Array<{
    id: number;
    type: string;
    value: string;
    description: string;
    campaign: string;
  }>
> {
  if (!db) await initializeDatabase();

  if (type) {
    const stmt = db!.prepare(`
      SELECT id, type, value, description, campaign
      FROM iocs
      WHERE type = ? AND value = ?
    `);
    return stmt.all(type, value) as Array<{
      id: number;
      type: string;
      value: string;
      description: string;
      campaign: string;
    }>;
  }

  const stmt = db!.prepare(`
    SELECT id, type, value, description, campaign
    FROM iocs
    WHERE value = ?
  `);

  return stmt.all(value) as Array<{
    id: number;
    type: string;
    value: string;
    description: string;
    campaign: string;
  }>;
}

export default initializeDatabase;
