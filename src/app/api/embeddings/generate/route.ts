import { NextResponse } from 'next/server';
import {
    getPackagesWithoutEmbeddings,
    savePackageEmbedding,
    getPackagesWithEmbeddings,
    getPackageStats
} from '@/lib/db';
import { createLocalEmbeddingsService } from '@/lib/local-embeddings';

export async function GET() {
    try {
        const { total } = await getPackageStats();
        const withEmbeddings = (await getPackagesWithEmbeddings()).length;
        const withoutEmbeddings = total - withEmbeddings;
        const completionPercentage = total > 0 ? Math.round((withEmbeddings / total) * 100) : 0;

        return NextResponse.json({
            total,
            withEmbeddings,
            withoutEmbeddings,
            completionPercentage
        });
    } catch (error) {
        console.error('Error fetching embedding stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { batchSize = 10 } = await req.json();

        // 1. Get packages that need embeddings
        const packages = await getPackagesWithoutEmbeddings(batchSize);

        if (packages.length === 0) {
            return NextResponse.json({ message: 'No packages need embeddings', count: 0 });
        }

        // 2. Generate embeddings
        const embeddingsService = createLocalEmbeddingsService();
        const results = await embeddingsService.batchGeneratePackageEmbeddings(packages);

        // 3. Save to DB
        let successCount = 0;
        for (const result of results) {
            if (result.embedding && result.embedding.length > 0) {
                await savePackageEmbedding(result.id, result.embedding);
                successCount++;
            }
        }

        return NextResponse.json({
            message: `Generated embeddings for ${successCount} packages`,
            count: successCount
        });

    } catch (error) {
        console.error('Error generating embeddings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
