# Architecture

The v0.1.0 product is a static React/Vite browser application. The browser owns the document
records, chunk text, embeddings, model cache, retrieval, and generation runtime.

```text
user gesture
    ├── static app shell ── service worker cache
    ├── explicit GGUF download ── SHA-256 ── IndexedDB model cache ── wllama WASM/WebGPU
    └── File ── PDF.js or File.text ── normalized chunks
                         └── Transformers.js worker ── normalized vectors ── IndexedDB
question ── Transformers.js worker ── cosine top four ── grounded prompt ── wllama stream
                                                     └── source IDs and excerpts
```

The UI depends on the `LocalAIEngine` contract, not directly on wllama. The production engine
uses `@wllama/wllama` for GGUF inference and Transformers.js in a module worker for embeddings.
Document records and chunks use a small typed IndexedDB wrapper. The service worker caches only
same-origin GET responses for the application shell; it does not provide a remote inference path.

## Boundaries

- The first application and model downloads are explicit and online.
- Hugging Face is a model and embedding artifact source, not an inference provider.
- No server, account, telemetry, cloud synchronization, vector database, or native application is
  part of v0.1.0.
- Document text is inserted into a clearly delimited prompt as untrusted data. This is risk
  reduction, not prompt-injection protection.
- The network-boundary test records browser requests after model setup and includes a positive
  control; the absence of requests without that control would not be proof.

## Version-specific decisions

- React 19.3.0 and Vite 8.3.0 are pinned in `package.json` and `package-lock.json`.
- wllama 3.6.1 uses its documented `Wllama` constructor, `loadModel`, streaming
  `createChatCompletion`, `setCompat(null)`, and `exit()` lifecycle.
- Transformers.js 4.3.0 uses the documented `pipeline('feature-extraction', ...)` path with the
  repository's verified `q4` ONNX artifact, mean pooling, and normalization.
- PDF.js 6.3.289 uses `getDocument`, `getPage`, `getTextContent`, and `cleanup()`.
- The Qwen model advertises a 32,768-token context; the browser runtime caps the active context at
  4,096 to bound memory on CPU/WASM fallback devices.

Official references: [React TypeScript](https://react.dev/learn/typescript),
[Vite](https://vite.dev/guide/), [wllama](https://github.com/ngxson/wllama),
[Transformers.js](https://huggingface.co/docs/transformers.js/en/index),
[PDF.js API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html),
[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API),
[WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API), and
[Firebase Hosting headers](https://firebase.google.com/docs/hosting/full-config).
