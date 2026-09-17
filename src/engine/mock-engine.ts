import type { AnswerEvent, LocalAIEngine, ModelDescriptor, SourceDocument } from './types'
import { listChunks, saveDocument } from '../storage/local-db'
import { createGenerationMetrics } from '../metrics/metrics'

export class MockEngine implements LocalAIEngine {
  async loadModel(_model: ModelDescriptor, onProgress: (loaded: number, total: number) => void) {
    onProgress(1, 1)
  }

  async ingest(files: File[]): Promise<SourceDocument[]> {
    const documents: SourceDocument[] = []
    for (const file of files) {
      const document: SourceDocument = {
        id: `mock-${file.name}`,
        name: file.name,
        mimeType: file.type || 'text/plain',
        sizeBytes: file.size,
        createdAt: Date.now(),
      }
      await saveDocument(document, [
        {
          id: `${document.id}-0`,
          documentId: document.id,
          sourceName: document.name,
          text: await file.text(),
          position: 0,
          embedding: [1, 0],
        },
      ])
      documents.push(document)
    }
    return documents
  }

  async *answer(_question: string): AsyncIterable<AnswerEvent> {
    const startedAt = performance.now()
    const chunks = await listChunks()
    yield { type: 'sources', value: chunks.map((chunk) => ({ ...chunk, score: 1 })) }
    const answer = `Local answer citing ${chunks[0]?.id ?? 'no source'}.`
    yield { type: 'token', value: answer }
    yield {
      type: 'metrics',
      value: createGenerationMetrics(
        startedAt,
        performance.now(),
        answer.length,
        performance.now(),
      ),
    }
    yield { type: 'complete', value: undefined }
  }

  async deleteDocument(documentId: string): Promise<void> {
    const { deleteDocument } = await import('../storage/local-db')
    await deleteDocument(documentId)
  }

  async clearAllLocalData(): Promise<void> {
    const { clearLocalDocumentData } = await import('../storage/local-db')
    await clearLocalDocumentData()
  }

  async dispose(): Promise<void> {}
}
