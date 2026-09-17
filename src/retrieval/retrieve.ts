import { APP_LIMITS } from '../app/limits'
import type { DocumentChunk, RetrievedChunk } from '../engine/types'
import { cosineSimilarity } from './cosine'

export const MIN_RETRIEVAL_SCORE = 0.35

export function retrieveChunks(
  questionEmbedding: number[],
  chunks: DocumentChunk[],
  limit = APP_LIMITS.retrievedChunks,
): RetrievedChunk[] {
  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(questionEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit)
}

export function hasRelevantContext(chunks: RetrievedChunk[]): boolean {
  return chunks.length > 0 && chunks[0].score >= MIN_RETRIEVAL_SCORE
}
