import Database from 'better-sqlite3';
import { searchCache, statsCache } from './cache';
import { PerformanceMonitor } from './performance';

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private db: Database.Database | null = null;

  static getInstance(): DatabaseOptimizer {
    if (!this.instance) {
      this.instance = new DatabaseOptimizer();
    }
    return this.instance;
  }

  initialize(db: Database.Database) {
    this.db = db;
    this.applyOptimizations();
  }

  private applyOptimizations() {
    if (!this.db) throw new Error('Database not initialized');

    // Performance optimizations
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = memory');
    this.db.pragma('mmap_size = 268435456'); // 256MB memory map
    this.db.pragma('optimize');
    
    // Enable query planner optimizations
    this.db.pragma('analysis_limit = 1000');
    this.db.pragma('automatic_index = ON');
    
    console.log('🔧 Database optimizations applied');
  }

  // Create optimized indexes for better query performance
  async createIndexes() {
    if (!this.db) throw new Error('Database not initialized');

    await PerformanceMonitor.measure('create-indexes', async () => {
      // Index for package name searches
      this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name)`);
      
      // Index for risk level queries
      this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_packages_risk_level ON packages(risk_level)`);
      
      // Composite index for common queries
      this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_packages_name_version ON packages(name, version)`);
      
      // Index for ecosystem filtering
      this.db!.exec(`CREATE INDEX IF NOT EXISTS idx_packages_ecosystem ON packages(ecosystem)`);
      
      console.log('📊 Database indexes created/verified');
    });
  }

  // Analyze query performance
  async analyzeQueryPerformance(query: string, params: unknown[] = []) {
    if (!this.db) throw new Error('Database not initialized');

    return await PerformanceMonitor.measure(`query-analysis:${query.slice(0, 20)}`, async () => {
      // Use EXPLAIN QUERY PLAN to analyze the query
      const explain = this.db!.prepare(`EXPLAIN QUERY PLAN ${query}`);
      const plan = explain.all(...params) as Array<{
        id: number;
        parent: number;
        notused: number;
        detail: string;
      }>;
      
      return {
        query,
        plan,
        hasIndexes: plan.some((step) => step.detail?.includes('USING INDEX')),
        estimatedCost: plan.reduce((total: number, step) => total + (step.notused || 0), 0)
      };
    });
  }

  // Vacuum and reorganize database
  async optimizeDatabase() {
    if (!this.db) throw new Error('Database not initialized');

    await PerformanceMonitor.measure('database-optimize', async () => {
      console.log('🧹 Starting database optimization...');
      
      // Analyze the database to update statistics
      this.db!.exec('ANALYZE');
      
      // Rebuild the database to reduce fragmentation
      this.db!.exec('VACUUM');
      
      // Re-optimize after vacuum
      this.db!.exec('PRAGMA optimize');
      
      console.log('✅ Database optimization completed');
    });
  }

  // Get database statistics
  getDatabaseStats() {
    if (!this.db) throw new Error('Database not initialized');

    const stats = {
      pageCount: this.db.prepare('PRAGMA page_count').get() as { page_count: number },
      pageSize: this.db.prepare('PRAGMA page_size').get() as { page_size: number },
      cacheSize: this.db.prepare('PRAGMA cache_size').get() as { cache_size: number },
      journalMode: this.db.prepare('PRAGMA journal_mode').get() as { journal_mode: string },
      synchronous: this.db.prepare('PRAGMA synchronous').get() as { synchronous: number },
      walCheckpoint: this.db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get() as {
        busy: number;
        log: number;
        checkpointed: number;
      },
    };

    return {
      ...stats,
      totalSize: stats.pageCount.page_count * stats.pageSize.page_size,
      cacheSizeBytes: Math.abs(stats.cacheSize.cache_size) * 1024, // cache_size is in KB
    };
  }

  // Clear cache and reset performance metrics
  reset() {
    searchCache.clear();
    statsCache.clear();
    PerformanceMonitor.clear();
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance();
