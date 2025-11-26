import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

async function migrateToDrizzle() {
  const dbPath = path.join(process.cwd(), 'data', 'shai-hulud.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('Database does not exist. Please run update-real-packages.ts first.');
    return;
  }

  const db = new Database(dbPath);

  try {
    // Check if the database already has the correct schema
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='packages'").get();
    
    if (!tableInfo) {
      console.log('Creating packages table with Drizzle schema...');
      
      // Create packages table with Drizzle schema
      db.exec(`
        CREATE TABLE packages (
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

      // Create FTS table
      db.exec(`
        CREATE VIRTUAL TABLE packages_fts USING fts5(
          name, 
          version, 
          description, 
          maintainer,
          content='packages',
          content_rowid='id'
        )
      `);

      // Create triggers
      db.exec(`
        CREATE TRIGGER packages_fts_insert AFTER INSERT ON packages
        BEGIN
          INSERT INTO packages_fts(rowid, name, version, description, maintainer)
          VALUES (new.id, new.name, new.version, new.description, new.maintainer);
        END
      `);

      db.exec(`
        CREATE TRIGGER packages_fts_delete AFTER DELETE ON packages
        BEGIN
          INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
          VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
        END
      `);

      db.exec(`
        CREATE TRIGGER packages_fts_update AFTER UPDATE ON packages
        BEGIN
          INSERT INTO packages_fts(packages_fts, rowid, name, version, description, maintainer)
          VALUES ('delete', old.id, old.name, old.version, old.description, old.maintainer);
          INSERT INTO packages_fts(rowid, name, version, description, maintainer)
          VALUES (new.id, new.name, new.version, new.description, new.maintainer);
        END
      `);

      console.log('Database schema created successfully!');
    } else {
      console.log('Database table already exists. Checking schema...');
      
      // Check if all required columns exist
      const columns = db.prepare("PRAGMA table_info(packages)").all() as Array<{name: string}>;
      const requiredColumns = ['id', 'name', 'version', 'ecosystem', 'first_seen', 'risk_level', 'description', 'maintainer', 'download_count', 'embedding'];
      
      const existingColumns = columns.map(col => col.name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('Missing columns:', missingColumns);
        console.log('Adding missing columns...');
        
        for (const column of missingColumns) {
          if (column === 'ecosystem') {
            db.exec("ALTER TABLE packages ADD COLUMN ecosystem TEXT DEFAULT 'npm'");
          } else if (column === 'first_seen') {
            db.exec("ALTER TABLE packages ADD COLUMN first_seen TEXT DEFAULT CURRENT_TIMESTAMP");
          } else if (column === 'risk_level') {
            db.exec("ALTER TABLE packages ADD COLUMN risk_level TEXT DEFAULT 'high'");
          } else if (column === 'description') {
            db.exec("ALTER TABLE packages ADD COLUMN description TEXT");
          } else if (column === 'maintainer') {
            db.exec("ALTER TABLE packages ADD COLUMN maintainer TEXT");
          } else if (column === 'download_count') {
            db.exec("ALTER TABLE packages ADD COLUMN download_count INTEGER DEFAULT 0");
          } else if (column === 'embedding') {
            db.exec("ALTER TABLE packages ADD COLUMN embedding BLOB");
          }
        }
        
        console.log('Missing columns added successfully!');
      } else {
        console.log('Database schema is up to date!');
      }
    }

    // Update existing packages to have proper risk levels if they're null
    const updateResult = db.prepare("UPDATE packages SET risk_level = 'high' WHERE risk_level IS NULL").run();
    if (updateResult.changes > 0) {
      console.log(`Updated ${updateResult.changes} packages with default risk level`);
    }

    // Get final package count
    const packageCount = db.prepare("SELECT COUNT(*) as count FROM packages").get() as {count: number};
    console.log(`Total packages in database: ${packageCount.count}`);

    db.close();
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

migrateToDrizzle().catch(console.error);
