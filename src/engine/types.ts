export interface ModelDescriptor {
  id: string
  displayName: string
  sourceUrl: string
  sha256: string
  sizeBytes: number
  contextSize: number
  licenseName: string
  licenseUrl: string
}

export interface ModelProfile extends ModelDescriptor {
  quantization: string
  recommendedMinimumMemory: string
  testedDevices: string[]
  testedRuntimeVersion: string
}

export interface SourceDocument {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  createdAt: number
}

export interface DocumentChunk {
  id: string
  documentId: string
  sourceName: string
  text: string
  position: number
  embedding: number[]
}

export interface RetrievedChunk extends DocumentChunk {
  score: number
}

export interface AnswerEvent {
  type: 'token' | 'sources' | 'metrics' | 'complete' | 'error'
  value: unknown
}

export interface LocalAIEngine {
  loadModel(
    model: ModelDescriptor,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<void>
  ingest(files: File[]): Promise<SourceDocument[]>
  answer(question: string): AsyncIterable<AnswerEvent>
  deleteDocument(documentId: string): Promise<void>
  clearAllLocalData(): Promise<void>
  dispose(): Promise<void>
}

export interface CancellableLocalAIEngine extends LocalAIEngine {
  cancelGeneration(): void
}
