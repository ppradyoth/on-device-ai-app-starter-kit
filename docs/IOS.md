# iOS integration path

Native iOS implementation is intentionally not included before `v0.1.0`.

The planned integration boundary is a Swift host that owns file selection and lifecycle while a
future local inference module owns model storage, extraction, embeddings, retrieval, and deletion.
The browser implementation is the behavioral reference: explicit model download, local document
processing, citations, offline continuation, and complete deletion.

Before implementation, verify current Apple documentation for the selected runtime, background
work limits, sandbox storage, and model licensing. Do not describe this document as an iOS app or
as evidence that the browser model runs on iOS.
