import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DEFAULT_MODEL } from '../engine/model-manifest'
import type { LocalAIEngine, RetrievedChunk, SourceDocument } from '../engine/types'
import { createEngine } from '../engine/engine-factory'
import { listChunks, listDocuments } from '../storage/local-db'
import { detectCapabilities, type CapabilityReport } from '../security/capabilities'
import './app.css'

type SetupState = 'needs-model' | 'downloading-model' | 'loading-model' | 'ready' | 'error'

interface StorageInfo {
  usage: number
  quota: number
  persisted: boolean
}

function CapabilityList({ report }: { report: CapabilityReport }) {
  return (
    <dl className="capability-list">
      <div>
        <dt>WebGPU</dt>
        <dd>{report.webGpu ? 'Available' : 'Unavailable — WASM fallback will be used'}</dd>
      </div>
      <div>
        <dt>WebAssembly</dt>
        <dd>{report.webAssembly ? 'Available' : 'Unavailable'}</dd>
      </div>
      <div>
        <dt>IndexedDB</dt>
        <dd>{report.indexedDb ? 'Available' : 'Unavailable'}</dd>
      </div>
      <div>
        <dt>Storage estimate</dt>
        <dd>{report.storageEstimate ? 'Available' : 'Unavailable'}</dd>
      </div>
    </dl>
  )
}

export default function App() {
  const [report] = useState(detectCapabilities)
  const [setupState, setSetupState] = useState<SetupState>('needs-model')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [question, setQuestion] = useState('Say hello in one short sentence.')
  const [answer, setAnswer] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [chunkCounts, setChunkCounts] = useState<Record<string, number>>({})
  const [sources, setSources] = useState<RetrievedChunk[]>([])
  const [isIndexing, setIsIndexing] = useState(false)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | undefined>()
  const [persistenceMessage, setPersistenceMessage] = useState<string | undefined>()
  const engineRef = useRef<LocalAIEngine | null>(null)

  useEffect(() => {
    return () => {
      void engineRef.current?.dispose()
    }
  }, [])

  const loadModel = async () => {
    setErrorMessage(undefined)
    setSetupState('downloading-model')
    const engine = engineRef.current ?? createEngine()
    engineRef.current = engine
    try {
      await engine.loadModel(DEFAULT_MODEL, (loaded, total) => {
        setDownloadProgress(total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0)
      })
      await refreshDocuments()
      await refreshStorage()
      setSetupState('ready')
    } catch (error) {
      setSetupState('error')
      setErrorMessage(error instanceof Error ? error.message : 'Model setup failed.')
    }
  }

  const ingestDocuments = async (files: File[]) => {
    if (!engineRef.current || files.length === 0) return
    setErrorMessage(undefined)
    setIsIndexing(true)
    try {
      await engineRef.current.ingest(files)
      await refreshDocuments()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Document indexing failed.')
    } finally {
      setIsIndexing(false)
    }
  }

  const removeDocument = async (documentId: string) => {
    if (!engineRef.current) return
    try {
      await engineRef.current.deleteDocument(documentId)
      await refreshDocuments()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Document deletion failed.')
    }
  }

  const refreshDocuments = async () => {
    const [nextDocuments, chunks] = await Promise.all([listDocuments(), listChunks()])
    const nextCounts: Record<string, number> = {}
    for (const chunk of chunks)
      nextCounts[chunk.documentId] = (nextCounts[chunk.documentId] ?? 0) + 1
    setDocuments(nextDocuments)
    setChunkCounts(nextCounts)
  }

  const refreshStorage = async () => {
    if (!navigator.storage?.estimate) return
    const estimate = await navigator.storage.estimate()
    setStorageInfo({
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      persisted: navigator.storage.persisted ? await navigator.storage.persisted() : false,
    })
  }

  const requestPersistence = async () => {
    setPersistenceMessage(undefined)
    if (!navigator.storage?.persist) {
      setPersistenceMessage('Persistent storage is not available in this browser.')
      return
    }
    const granted = await navigator.storage.persist()
    setPersistenceMessage(
      granted ? 'Persistent storage enabled.' : 'The browser declined persistent storage.',
    )
    await refreshStorage()
  }

  const clearAllLocalData = async () => {
    if (
      !engineRef.current ||
      !window.confirm('Delete the model, documents, index, and local history?')
    )
      return
    await engineRef.current.clearAllLocalData()
    setDocuments([])
    setChunkCounts({})
    setSources([])
    setAnswer('')
    await refreshStorage()
  }

  const askQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!engineRef.current || !question.trim()) return
    setAnswer('')
    setSources([])
    setIsGenerating(true)
    for await (const result of engineRef.current.answer(question)) {
      if (result.type === 'token') setAnswer((current) => current + String(result.value))
      if (result.type === 'sources') setSources(result.value as typeof sources)
      if (result.type === 'error') setErrorMessage(String(result.value))
    }
    setIsGenerating(false)
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <span className="wordmark">ON-DEVICE AI</span>
        <span className="local-badge">LOCAL MODE</span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">A starter kit for private-by-design prototypes</p>
        <h1 id="page-title">Ask your documents questions inside the browser.</h1>
        <p className="hero-copy">
          Download a local model, add documents, and build a grounded question-answering workflow
          that can continue after the required assets are cached.
        </p>
      </section>

      <section className="status-card" aria-labelledby="compatibility-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Phase 1 capability check</p>
            <h2 id="compatibility-title">
              {report.supported ? 'Ready to continue' : 'Browser not supported'}
            </h2>
          </div>
          <span className={report.supported ? 'status-pill status-good' : 'status-pill status-bad'}>
            {report.supported ? 'SUPPORTED' : 'UNSUPPORTED'}
          </span>
        </div>
        <CapabilityList report={report} />
        {!report.supported && (
          <ul className="reason-list">
            {report.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="model-card" aria-labelledby="model-title">
        <div>
          <p className="eyebrow">Small default model</p>
          <h2 id="model-title">{DEFAULT_MODEL.displayName}</h2>
          <p>
            {DEFAULT_MODEL.licenseName} · {DEFAULT_MODEL.quantization} quantization ·{' '}
            {(DEFAULT_MODEL.sizeBytes / 1_000_000).toFixed(0)} MB download
          </p>
        </div>
        <button
          type="button"
          disabled={!report.supported || setupState === 'downloading-model'}
          onClick={loadModel}
        >
          {setupState === 'ready'
            ? 'Model ready'
            : setupState === 'downloading-model'
              ? 'Setting up…'
              : 'Download model'}{' '}
          <span aria-hidden="true">→</span>
        </button>
        {setupState === 'downloading-model' && (
          <div className="progress-block" aria-live="polite">
            <progress max="100" value={downloadProgress} />
            <span>{downloadProgress}% — downloading and verifying model</span>
          </div>
        )}
        {setupState === 'ready' && (
          <p className="success-note">Local model loaded. Document ingestion arrives next.</p>
        )}
        {setupState === 'error' && <p className="error-note">{errorMessage}</p>}
      </section>

      {setupState === 'ready' && (
        <section className="privacy-card" aria-labelledby="privacy-title">
          <p className="eyebrow">Verified boundary</p>
          <h2 id="privacy-title">LOCAL MODE</h2>
          <ul className="privacy-list">
            <li>Documents: stored in this browser</li>
            <li>Embeddings: generated in this browser</li>
            <li>Retrieval: performed in this browser</li>
            <li>Generation: performed in this browser</li>
            <li>Remote inference: disabled</li>
            <li>Telemetry: disabled</li>
          </ul>
          <p className="muted-note">
            Initial application and model files come from the internet. After those assets are
            cached, document ingestion and inference do not require a model provider.
          </p>
          <div className="privacy-actions">
            <button type="button" onClick={() => void requestPersistence()}>
              Keep local data persistent
            </button>
            <button type="button" onClick={() => void clearAllLocalData()}>
              Delete all local data
            </button>
          </div>
          {storageInfo && (
            <p className="muted-note">
              Storage estimate: {(storageInfo.usage / 1_000_000).toFixed(1)} MB used of{' '}
              {(storageInfo.quota / 1_000_000).toFixed(1)} MB available · persistent:{' '}
              {storageInfo.persisted ? 'yes' : 'no'}
            </p>
          )}
          {persistenceMessage && <p className="muted-note">{persistenceMessage}</p>}
        </section>
      )}

      {setupState === 'ready' && (
        <section className="documents-card" aria-labelledby="documents-title">
          <p className="eyebrow">Phase 3 local ingestion</p>
          <h2 id="documents-title">Your documents</h2>
          <label
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              void ingestDocuments(Array.from(event.dataTransfer.files))
            }}
          >
            <span>
              {isIndexing ? 'Indexing locally…' : 'Drop PDF, Markdown, or text files here'}
            </span>
            <input
              type="file"
              accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
              multiple
              disabled={isIndexing}
              onChange={(event) => {
                void ingestDocuments(Array.from(event.currentTarget.files ?? []))
                event.currentTarget.value = ''
              }}
            />
          </label>
          <p className="muted-note">
            Maximum 20 MB per file and 20 documents. Files are processed in this browser.
          </p>
          {documents.length === 0 ? (
            <p className="empty-note">No indexed documents yet.</p>
          ) : (
            <ul className="document-list">
              {documents.map((document) => (
                <li key={document.id}>
                  <span>
                    {document.name} · {chunkCounts[document.id] ?? 0} chunks
                  </span>
                  <button type="button" onClick={() => void removeDocument(document.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errorMessage && <p className="error-note">{errorMessage}</p>}
        </section>
      )}

      {setupState === 'ready' && (
        <section className="chat-card" aria-labelledby="phase-two-chat-title">
          <p className="eyebrow">Phase 2 local generation smoke test</p>
          <h2 id="phase-two-chat-title">Ask the loaded model</h2>
          <form onSubmit={askQuestion}>
            <label htmlFor="question">Question</label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
            />
            <button type="submit" disabled={isGenerating || !question.trim()}>
              {isGenerating ? 'Generating…' : 'Generate locally'}
            </button>
          </form>
          {answer && (
            <p className="answer-output" aria-live="polite">
              {answer}
            </p>
          )}
          {sources.length > 0 && (
            <details className="citations" open>
              <summary>Sources ({sources.length})</summary>
              <ul>
                {sources.map((source) => (
                  <li key={source.id}>
                    <strong>{source.sourceName}</strong> · {source.id} · score{' '}
                    {source.score.toFixed(3)}
                    <p>{source.text}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <footer className="footer-note">
        <span>Initial app and model downloads require the internet.</span>
        <a href="https://github.com/ppradyoth/on-device-ai-app-starter-kit/blob/main/SECURITY.md">
          Read the security boundaries
        </a>
      </footer>
    </main>
  )
}
