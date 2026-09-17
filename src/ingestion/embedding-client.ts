interface EmbeddingWorkerRequest {
  id: number
  texts: string[]
}

interface EmbeddingWorkerResponse {
  id: number
  embeddings?: number[][]
  error?: string
}

export class EmbeddingClient {
  private readonly worker = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url), {
    type: 'module',
  })
  private nextRequestId = 1
  private readonly pending = new Map<
    number,
    { resolve: (value: number[][]) => void; reject: (reason: Error) => void }
  >()

  constructor() {
    this.worker.onmessage = ({ data }: MessageEvent<EmbeddingWorkerResponse>) => {
      const request = this.pending.get(data.id)
      if (!request) return
      this.pending.delete(data.id)
      if (data.error) request.reject(new Error(data.error))
      else request.resolve(data.embeddings ?? [])
    }
    this.worker.onerror = () => {
      for (const request of this.pending.values())
        request.reject(new Error('Embedding worker failed.'))
      this.pending.clear()
    }
  }

  embed(texts: string[]): Promise<number[][]> {
    const id = this.nextRequestId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      const message: EmbeddingWorkerRequest = { id, texts }
      this.worker.postMessage(message)
    })
  }

  dispose(): void {
    this.worker.terminate()
    for (const request of this.pending.values())
      request.reject(new Error('Embedding was cancelled.'))
    this.pending.clear()
  }
}
