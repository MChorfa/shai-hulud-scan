// Main embeddings exports - using local embeddings by default
export { 
  createLocalEmbeddingsService as createEmbeddingsService,
  LocalEmbeddingsService,
  type EmbeddingResult,
  type PackageWithEmbedding,
  type SearchResult
} from './local-embeddings';

// Optional OpenAI fallback (commented out - not used)
// export { OpenAIEmbeddings } from './openai-embeddings';
