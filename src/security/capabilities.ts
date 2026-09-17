export interface CapabilityInputs {
  secureContext: boolean
  webGpu: boolean
  webAssembly: boolean
  indexedDb: boolean
  storageEstimate: boolean
}

export interface CapabilityReport extends CapabilityInputs {
  supported: boolean
  reasons: string[]
}

export function evaluateCapabilities(inputs: CapabilityInputs): CapabilityReport {
  const reasons: string[] = []

  if (!inputs.secureContext) reasons.push('This app requires a secure HTTPS context.')
  if (!inputs.webAssembly) reasons.push('WebAssembly is unavailable in this browser.')
  if (!inputs.indexedDb) reasons.push('IndexedDB is unavailable for local application data.')
  if (!inputs.storageEstimate) reasons.push('Storage estimates are unavailable.')

  return {
    ...inputs,
    supported: reasons.length === 0,
    reasons,
  }
}

export function detectCapabilities(): CapabilityReport {
  return evaluateCapabilities({
    secureContext: globalThis.isSecureContext,
    webGpu: 'gpu' in navigator,
    webAssembly: typeof WebAssembly === 'object',
    indexedDb: 'indexedDB' in globalThis,
    storageEstimate: 'storage' in navigator && 'estimate' in navigator.storage,
  })
}
