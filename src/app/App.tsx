import { useState } from 'react'
import { detectCapabilities, type CapabilityReport } from '../security/capabilities'
import './app.css'

const MODEL_SIZE = '639 MB'

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
          <h2 id="model-title">Qwen3-0.6B-GGUF</h2>
          <p>Apache-2.0 · Q8_0 quantization · {MODEL_SIZE} download</p>
        </div>
        <button type="button" disabled={!report.supported}>
          Download model <span aria-hidden="true">→</span>
        </button>
        <p className="muted-note">Model download and local inference arrive in Phase 2.</p>
      </section>

      <footer className="footer-note">
        <span>Initial app and model downloads require the internet.</span>
        <a href="https://github.com/ppradyoth/on-device-ai-app-starter-kit/blob/main/SECURITY.md">
          Read the security boundaries
        </a>
      </footer>
    </main>
  )
}
