import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

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
  campaign: string;
}

interface StaticIoc {
  id: number;
  type: string;
  value: string;
  campaign: string;
  description: string | null;
  first_seen: string;
}

const dbPath = path.join(process.cwd(), "data", "shai-hulud.db");
const outputPath = path.join(process.cwd(), "public", "data", "packages.json");
const iocOutputPath = path.join(process.cwd(), "public", "data", "iocs.json");

console.log("Exporting database for GitHub Pages...");

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  const db = new Database(dbPath);

  // Export all packages
  const packages = db
    .prepare(
      `
    SELECT 
      id, name, version, ecosystem, first_seen as first_seen,
      risk_level, description, maintainer, download_count, campaign
    FROM packages 
    ORDER BY name
  `,
    )
    .all() as StaticPackage[];

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(packages, null, 2));

  console.log(`✅ Exported ${packages.length} packages to ${outputPath}`);

  // Create a stats file
  const stats = {
    total: packages.length,
    critical: packages.filter((p) => p.risk_level === "critical").length,
    high: packages.filter((p) => p.risk_level === "high").length,
    medium: packages.filter((p) => p.risk_level === "medium").length,
    low: packages.filter((p) => p.risk_level === "low").length,
    exported_at: new Date().toISOString(),
  };

  const statsPath = path.join(outputDir, "stats.json");
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

  console.log(`✅ Exported stats to ${statsPath}`);

  // Export IOCs
  const iocs = db
    .prepare(
      `
    SELECT
      id, type, value, campaign, description, first_seen as first_seen
    FROM iocs
    ORDER BY type, value
  `,
    )
    .all() as StaticIoc[];

  fs.writeFileSync(iocOutputPath, JSON.stringify(iocs, null, 2));
  console.log(`✅ Exported ${iocs.length} IOCs to ${iocOutputPath}`);

  db.close();
} catch (error) {
  console.error("❌ Export failed:", error);
  process.exit(1);
}
