import { describe, expect, it } from 'vitest'
import { evaluateCapabilities } from './capabilities'

describe('evaluateCapabilities', () => {
  it('supports a secure browser with the required local APIs', () => {
    const report = evaluateCapabilities({
      secureContext: true,
      webGpu: true,
      webAssembly: true,
      indexedDb: true,
      storageEstimate: true,
    })

    expect(report.supported).toBe(true)
    expect(report.reasons).toEqual([])
  })

  it('reports the missing baseline APIs without requiring WebGPU', () => {
    const report = evaluateCapabilities({
      secureContext: false,
      webGpu: false,
      webAssembly: true,
      indexedDb: false,
      storageEstimate: false,
    })

    expect(report.supported).toBe(false)
    expect(report.reasons).toEqual([
      'This app requires a secure HTTPS context.',
      'IndexedDB is unavailable for local application data.',
      'Storage estimates are unavailable.',
    ])
  })
})
