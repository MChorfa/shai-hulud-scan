import { initializeDatabase, savePackageEmbedding } from '../src/lib/db';
import { createLocalEmbeddingsService } from '../src/lib/local-embeddings';
import fs from 'fs';
import path from 'path';

async function buildDatabase() {
    console.log('🏗️  Building Shai-Hulud Database...');

    // 1. Initialize DB (creates tables and loads CSV data)
    const db = await initializeDatabase();
    console.log('✅ Database initialized and CSV data loaded.');

    // 2. Initialize Embeddings Service
    const embeddingsService = createLocalEmbeddingsService();
    await embeddingsService.initialize();
    console.log('✅ Embeddings service initialized.');

    // 3. Fetch all packages to generate embeddings for
    const packages = db.prepare('SELECT id, name, version, description FROM packages').all() as Array<{
        id: number;
        name: string;
        version: string;
        description: string;
    }>;

    console.log(`📦 Generating embeddings for ${packages.length} packages...`);

    // 4. Generate and save embeddings
    // Process in batches to avoid memory issues if list is huge, 
    // but for ~800 items, one batch is fine.
    const batchSize = 50;
    for (let i = 0; i < packages.length; i += batchSize) {
        const batch = packages.slice(i, i + batchSize);
        const results = await embeddingsService.batchGeneratePackageEmbeddings(batch);

        const insertStmt = db.prepare('UPDATE packages SET embedding = ? WHERE id = ?');

        const transaction = db.transaction((items) => {
            for (const item of items) {
                if (item.embedding && item.embedding.length > 0) {
                    const buffer = Buffer.from(new Float32Array(item.embedding).buffer);
                    insertStmt.run(buffer, item.id);
                }
            }
        });

        transaction(results);
        console.log(`   Processed ${Math.min(i + batchSize, packages.length)}/${packages.length}`);
    }

    console.log('✅ Embeddings generation complete.');

    // 5. Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM packages WHERE embedding IS NOT NULL').get() as { count: number };
    console.log(`📊 Total packages with embeddings: ${count.count}`);

    console.log('🎉 Database build finished successfully!');
}

buildDatabase().catch(console.error);
