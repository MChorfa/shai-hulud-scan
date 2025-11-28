import { pipeline, cos_sim, env } from '@huggingface/transformers';

interface EmbeddingResult {
  embedding: number[];
  text: string;
}

interface PackageWithEmbedding {
  id: number;
  name: string;
  version: string;
  description?: string;
  risk_level?: string;
  embedding?: number[];
}

interface SearchResult {
  package: PackageWithEmbedding;
  similarity: number;
}

class LocalEmbeddingsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractor: any = null;
  private model = 'Xenova/all-MiniLM-L6-v2'; // Small, efficient model
  private isInitialized = false;

  constructor() {
    // Configure cache directory for models
    env.cacheDir = './.cache/models';
    env.allowLocalModels = true;
    env.allowRemoteModels = true; // Allow remote models for initial download
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing local embedding model...');
      this.extractor = await pipeline(
        'feature-extraction',
        this.model,
        {
          device: 'cpu', // Use CPU for compatibility
          dtype: 'fp32', // Use float32 for compatibility
        }
      );
      this.isInitialized = true;
      console.log('Local embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local embedding model:', error);
      throw new Error('Embedding model initialization failed');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.extractor(text, {
        pooling: 'mean',
        normalize: true, // L2 normalization for cosine similarity
      });

      // Convert tensor to array
      return Array.from(result.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async generatePackageEmbedding(
    name: string,
    version: string,
    description?: string
  ): Promise<number[]> {
    const text = `${name} ${version} ${description || ''}`;
    return await this.generateEmbedding(text);
  }

  async batchGeneratePackageEmbeddings(
    packages: Array<{ id: number; name: string; version: string; description?: string }>
  ): Promise<Array<{ id: number; embedding: number[]; error?: string }>> {
    const results = [];

    for (const pkg of packages) {
      try {
        const embedding = await this.generatePackageEmbedding(
          pkg.name,
          pkg.version,
          pkg.description
        );
        results.push({ id: pkg.id, embedding });
      } catch (error) {
        console.error(`Failed to generate embedding for ${pkg.name}:`, error);
        results.push({
          id: pkg.id,
          embedding: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  async semanticSearch(
    query: string,
    packages: PackageWithEmbedding[],
    topK: number = 10
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Calculate cosine similarity with all packages
      const results: SearchResult[] = packages
        .filter(pkg => pkg.embedding && pkg.embedding.length > 0)
        .map(pkg => ({
          package: pkg,
          similarity: cos_sim(queryEmbedding, pkg.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return results;
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw new Error('Semantic search failed');
    }
  }

  // Composite search combining FTS (BM25) and semantic search
  async compositeSearch(
    query: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ftsResults: Array<any>, // Expects objects with bm25_score
    packagesWithEmbeddings: PackageWithEmbedding[],
    topK: number = 10,
    semanticWeight: number = 0.5
  ): Promise<SearchResult[]> {
    try {
      // Get semantic search results
      const semanticResults = await this.semanticSearch(query, packagesWithEmbeddings, topK * 2);

      // Normalize BM25 scores
      // SQLite bm25() returns <= 0, closer to 0 is better.
      // We want to map this to [0, 1] where 1 is best.
      // Strategy: Find min and max (which is <= 0) in the batch.
      // But since we only have the top K results, we can just normalize within this set.
      // Or use a sigmoid-like function: 1 / (1 + abs(score))

      const ftsMap = new Map<string, { package: PackageWithEmbedding; normalizedScore: number }>();

      if (ftsResults.length > 0) {
        // Find range for min-max normalization if needed, or just use rank-based
        // Let's use a simple transformation for negative scores:
        // score = 1 / (1 - raw_score)  (since raw_score is negative)
        // If raw_score is -1, score = 0.5. If raw_score is -0.1, score = 0.9.
        // If raw_score is -10, score = 0.09.

        ftsResults.forEach((pkg) => {
          const rawScore = pkg.bm25_score || -100; // Default low if missing
          const normalizedScore = 1 / (1 - rawScore);

          ftsMap.set(`${pkg.name}-${pkg.version}`, {
            package: pkg as PackageWithEmbedding,
            normalizedScore
          });
        });
      }

      // Combine results
      const combinedResults: SearchResult[] = [];
      const processedPackages = new Set<string>();

      // Add semantic results with composite scores
      semanticResults.forEach(result => {
        const packageKey = `${result.package.name}-${result.package.version}`;
        processedPackages.add(packageKey);

        const ftsData = ftsMap.get(packageKey);
        const ftsScore = ftsData ? ftsData.normalizedScore : 0;

        // Composite score: weighted combination
        const compositeScore = (semanticWeight * result.similarity) + ((1 - semanticWeight) * ftsScore);

        combinedResults.push({
          package: result.package,
          similarity: compositeScore
        });
      });

      // Add any FTS-only results that weren't in semantic results
      ftsResults.forEach((pkg) => {
        const packageKey = `${pkg.name}-${pkg.version}`;
        if (!processedPackages.has(packageKey)) {
          const ftsData = ftsMap.get(packageKey);
          const ftsScore = ftsData ? ftsData.normalizedScore : 0;

          combinedResults.push({
            package: pkg as PackageWithEmbedding,
            similarity: (1 - semanticWeight) * ftsScore // Only FTS score contribution
          });
        }
      });

      // Sort by composite score and return topK
      return combinedResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    } catch (error) {
      console.error('Error in composite search:', error);
      // Fallback to FTS results only
      return ftsResults.slice(0, topK).map((pkg) => ({
        package: pkg as PackageWithEmbedding,
        similarity: 0.5 // Dummy score
      }));
    }
  }
}

// Singleton instance
let localEmbeddingsInstance: LocalEmbeddingsService | null = null;

export function createLocalEmbeddingsService(): LocalEmbeddingsService {
  if (!localEmbeddingsInstance) {
    localEmbeddingsInstance = new LocalEmbeddingsService();
  }
  return localEmbeddingsInstance;
}

export type { EmbeddingResult, PackageWithEmbedding, SearchResult };
export { LocalEmbeddingsService };
