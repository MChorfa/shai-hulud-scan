import { NextResponse } from 'next/server';
import { searchPackagesBM25, getPackagesWithEmbeddings } from '@/lib/db';
import { createLocalEmbeddingsService } from '@/lib/local-embeddings';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        // 1. Get BM25 results from SQLite FTS5
        const ftsResults = await searchPackagesBM25(query, 50);

        // 2. Get all packages with embeddings for semantic search
        // Note: In a real app with millions of records, we'd use a vector DB (pgvector/sqlite-vec)
        // For this demo with ~800 packages, in-memory cosine similarity is fine.
        const packagesWithEmbeddings = await getPackagesWithEmbeddings();

        // 3. Perform composite search
        const embeddingsService = createLocalEmbeddingsService();
        const results = await embeddingsService.compositeSearch(
            query,
            ftsResults,
            packagesWithEmbeddings,
            20, // Top K
            0.5 // Weight (50% semantic, 50% keyword)
        );

        return NextResponse.json({
            results: results.map(r => ({
                ...r.package,
                relevance_score: r.similarity
            })),
            query,
            total: results.length
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
