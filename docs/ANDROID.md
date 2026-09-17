# Android integration path

Native Android implementation is intentionally not included before `v0.1.0`.

The planned integration boundary is a Kotlin host that owns document selection and lifecycle while
a future local inference module owns model storage, extraction, embeddings, retrieval, citations,
and deletion. The browser implementation is the behavioral reference for the proof flow.

Before implementation, verify current Android documentation for the selected runtime, scoped
storage, background work, hardware acceleration, and model licensing. Do not describe this
document as an Android app or as evidence that the browser model runs on Android.
