import { describe, expect, it } from 'vitest'
import { inspectNetworkBoundary, positiveControlDetectsMarker } from './network-boundary'

describe('network boundary inspection', () => {
  it('does not flag same-origin application requests after setup', () => {
    expect(
      inspectNetworkBoundary(
        [{ url: 'https://app.example.test/assets/index.js' }],
        ['DOCUMENT-MARKER'],
        ['https://app.example.test/'],
      ),
    ).toEqual([])
  })

  it('positive control catches a marker in an outbound request', () => {
    expect(
      positiveControlDetectsMarker(
        [{ url: 'https://app.example.test/test', body: 'DOCUMENT-MARKER' }],
        'DOCUMENT-MARKER',
      ),
    ).toBe(true)
  })
})
