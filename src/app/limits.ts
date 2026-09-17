export const APP_LIMITS = {
  chunkSize: 800,
  chunkOverlap: 120,
  maxFileSizeBytes: 20 * 1024 * 1024,
  maxDocuments: 20,
  retrievedChunks: 4,
} as const

export const ACCEPTED_EXTENSIONS = ['.pdf', '.md', '.markdown', '.txt'] as const
export const ACCEPTED_MIME_TYPES = ['application/pdf', 'text/markdown', 'text/plain', ''] as const
