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

  // Composite search combining FTS and semantic search
  async compositeSearch(
    query: string,
    ftsResults: PackageWithEmbedding[],
    packagesWithEmbeddings: PackageWithEmbedding[],
    topK: number = 10,
    semanticWeight: number = 0.6
  ): Promise<SearchResult[]> {
    try {
      // Get semantic search results
      const semanticResults = await this.semanticSearch(query, packagesWithEmbeddings, topK * 2);
      
      // Create a map of FTS results with their scores (normalized)
      const ftsMap = new Map<string, { package: PackageWithEmbedding; ftsScore: number }>();
      ftsResults.forEach((pkg, index) => {
        // Normalized FTS score (higher rank = higher score)
        const ftsScore = 1 - (index / ftsResults.length);
        ftsMap.set(`${pkg.name}-${pkg.version}`, { package: pkg, ftsScore });
      });

      // Combine results
      const combinedResults: SearchResult[] = [];
      const processedPackages = new Set<string>();

      // Add semantic results with composite scores
      semanticResults.forEach(result => {
        const packageKey = `${result.package.name}-${result.package.version}`;
        processedPackages.add(packageKey);

        const ftsData = ftsMap.get(packageKey);
        const ftsScore = ftsData ? ftsData.ftsScore : 0;
        
        // Composite score: weighted combination of semantic and FTS scores
        const compositeScore = (semanticWeight * result.similarity) + ((1 - semanticWeight) * ftsScore);

        combinedResults.push({
          package: result.package,
          similarity: compositeScore
        });
      });

      // Add any FTS-only results that weren't in semantic results
      ftsResults.forEach((pkg, index) => {
        const packageKey = `${pkg.name}-${pkg.version}`;
        if (!processedPackages.has(packageKey)) {
          const ftsScore = 1 - (index / ftsResults.length);
          combinedResults.push({
            package: pkg,
            similarity: (1 - semanticWeight) * ftsScore // Only FTS score
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
      return ftsResults.slice(0, topK).map((pkg, index) => ({
        package: pkg,
        similarity: 1 - (index / ftsResults.length)
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
