# Browser support and measured compatibility

The browser application requires a secure context, WebAssembly, IndexedDB, and the Storage API
estimate method. WebGPU is an acceleration path; the application reports when it is unavailable
and uses the wllama WebAssembly runtime fallback.

## Recorded environment

| Date       | Hardware                     | Operating system | Browser                                             | Result                                                                                                                                                     |
| ---------- | ---------------------------- | ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-17 | Apple MacBook Air (M1, 8 GB) | macOS 14.6.1     | Chrome for Testing 153.0.8010.12, Playwright 1.63.0 | Mocked local-mode flow passed: setup, ingestion, citations, deletion, service-worker offline reload, and network positive control                          |
| 2026-09-17 | Apple MacBook Air (M1, 8 GB) | macOS 14.6.1     | Chrome for Testing 153.0.8010.12, Playwright 1.63.0 | Deployed central proof passed: explicit model setup, real local indexing, citation, online answer `2026.`, offline answer `2026.`, and zero console errors |

The hardware and operating-system values come from `system_profiler SPHardwareDataType` and
`sw_vers`. The browser version comes from Playwright's launched Chromium binary. This is one
recorded environment, not a claim of universal browser support.

## Runtime behavior

- A browser without WebGPU is not rejected solely for that reason; the WASM fallback remains the
  supported path.
- A browser without secure context, WebAssembly, IndexedDB, or storage estimates is shown an
  unsupported state with a specific reason.
- `navigator.deviceMemory` and other optional device metrics are displayed as unavailable when
  the browser does not expose them. No memory figure is inferred.
- Resource and model setup failures remain on screen with a retry action.

## Not yet recorded

Android Chrome, iPhone Safari, Windows hardware, and a browser without WebGPU require separate
runs before they can be described as tested environments. Native iOS and Android implementations
are documented integration paths only.

## Official references

- [WebGPU API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Navigator.gpu](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/gpu)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Playwright browsers](https://playwright.dev/docs/browsers)
