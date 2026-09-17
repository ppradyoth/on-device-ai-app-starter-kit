import { LoggerWithoutDebug, Wllama } from '@wllama/wllama'
import wasmUrl from '@wllama/wllama/esm/wasm/wllama.wasm?url'
import { clearCachedModels, readCachedModel, writeCachedModel } from './model-storage'
import { ModelIntegrityError, verifyModelBlob } from './hash'
import { EmbeddingClient } from '../ingestion/embedding-client'
import { ingestFiles } from '../ingestion/ingestor'
import { clearLocalDocumentData, deleteDocument, listChunks } from '../storage/local-db'
import { createGenerationMetrics } from '../metrics/metrics'
import { buildGroundedPrompt, UNSUPPORTED_RESPONSE } from '../retrieval/prompt'
import { hasRelevantContext, retrieveChunks } from '../retrieval/retrieve'
import type {
  AnswerEvent,
  CancellableLocalAIEngine,
  ModelDescriptor,
  SourceDocument,
} from './types'

const MAX_OUTPUT_TOKENS = 128
const RUNTIME_CONTEXT_SIZE = 4096

async function downloadModel(
  model: ModelDescriptor,
  onProgress: (loaded: number, total: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  const response = await fetch(model.sourceUrl, { signal })
  if (!response.ok) throw new Error(`Model download failed with HTTP ${response.status}.`)
  if (!response.body) throw new Error('Model download did not provide a readable body.')

  const reader = response.body.getReader()
  const parts: ArrayBuffer[] = []
  let loaded = 0
  const total = Number(response.headers.get('content-length')) || model.sizeBytes
  onProgress(loaded, total)

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const part = new Uint8Array(value.byteLength)
    part.set(value)
    parts.push(part.buffer)
    loaded += value.byteLength
    onProgress(loaded, total)
  }

  const blob = new Blob(parts, { type: 'application/octet-stream' })
  await verifyModelBlob(blob, model.sha256)
  return blob
}

export class WllamaEngine implements CancellableLocalAIEngine {
  private runtime: Wllama | undefined
  private loadAbortController: AbortController | undefined
  private generationAbortController: AbortController | undefined
  private loadedModelId: string | undefined
  private readonly embeddings = new EmbeddingClient()

  async loadModel(
    model: ModelDescriptor,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<void> {
    this.loadAbortController?.abort()
    const controller = new AbortController()
    this.loadAbortController = controller
    const cached = await readCachedModel(model.id)
    const blob = cached ?? (await downloadModel(model, onProgress, controller.signal))
    if (cached) onProgress(model.sizeBytes, model.sizeBytes)

    try {
      await verifyModelBlob(blob, model.sha256)
    } catch (error) {
      await clearCachedModels()
      if (error instanceof ModelIntegrityError) throw error
      throw new Error('Model integrity verification failed.', { cause: error })
    }

    await this.runtime?.exit()
    const runtime = new Wllama(
      { default: wasmUrl },
      { logger: LoggerWithoutDebug, allowOffline: true },
    )
    runtime.setCompat(null)
    try {
      await runtime.loadModel([blob], {
        n_ctx: Math.min(model.contextSize, RUNTIME_CONTEXT_SIZE),
        n_gpu_layers: -1,
        n_threads: -1,
        warmup: true,
      })
      await writeCachedModel(model.id, blob)
      this.runtime = runtime
      this.loadedModelId = model.id
    } catch (error) {
      await runtime.exit().catch(() => undefined)
      throw error
    }
  }

  ingest(files: File[]): Promise<SourceDocument[]> {
    return ingestFiles(files, this.embeddings)
  }

  async *answer(question: string): AsyncIterable<AnswerEvent> {
    if (!this.runtime || !this.loadedModelId)
      throw new Error('Load a model before asking a question.')
    if (!question.trim()) throw new Error('Question cannot be empty.')
    const controller = new AbortController()
    this.generationAbortController = controller
    const startedAt = performance.now()
    let firstTokenAt: number | undefined
    let outputUnits = 0
    try {
      const chunks = await listChunks()
      if (chunks.length === 0) {
        yield { type: 'sources', value: [] }
        yield { type: 'token', value: UNSUPPORTED_RESPONSE }
        yield {
          type: 'metrics',
          value: createGenerationMetrics(
            startedAt,
            startedAt,
            UNSUPPORTED_RESPONSE.length,
            performance.now(),
          ),
        }
        yield { type: 'complete', value: undefined }
        return
      }
      const questionEmbedding = await this.embeddings.embed([question])
      const retrieved = retrieveChunks(questionEmbedding[0] ?? [], chunks)
      yield { type: 'sources', value: retrieved }
      if (!hasRelevantContext(retrieved)) {
        yield { type: 'token', value: UNSUPPORTED_RESPONSE }
        yield {
          type: 'metrics',
          value: createGenerationMetrics(
            startedAt,
            startedAt,
            UNSUPPORTED_RESPONSE.length,
            performance.now(),
          ),
        }
        yield { type: 'complete', value: undefined }
        return
      }
      const stream = await this.runtime.createChatCompletion({
        messages: [{ role: 'user', content: buildGroundedPrompt(question, retrieved) }],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        stream: true,
        abortSignal: controller.signal,
      })
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta.content
        if (token) {
          firstTokenAt ??= performance.now()
          outputUnits += token.length
          yield { type: 'token', value: token }
        }
      }
      yield {
        type: 'metrics',
        value: createGenerationMetrics(startedAt, firstTokenAt, outputUnits, performance.now()),
      }
      yield { type: 'complete', value: undefined }
    } catch (error) {
      yield { type: 'error', value: error instanceof Error ? error.message : 'Generation failed.' }
    } finally {
      this.generationAbortController = undefined
    }
  }

  cancelGeneration(): void {
    this.generationAbortController?.abort()
  }

  deleteDocument(documentId: string): Promise<void> {
    return deleteDocument(documentId)
  }

  async clearAllLocalData(): Promise<void> {
    this.cancelGeneration()
    await this.runtime?.exit()
    this.runtime = undefined
    this.loadedModelId = undefined
    this.embeddings.dispose()
    await clearLocalDocumentData()
    await clearCachedModels()
  }

  async dispose(): Promise<void> {
    this.loadAbortController?.abort()
    this.cancelGeneration()
    await this.runtime?.exit()
    this.runtime = undefined
    this.loadedModelId = undefined
    this.embeddings.dispose()
  }
}
