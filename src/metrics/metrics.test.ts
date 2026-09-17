import { describe, expect, it } from 'vitest'
import { createGenerationMetrics } from './metrics'

describe('generation metrics', () => {
  it('records time to first token and throughput', () => {
    expect(createGenerationMetrics(100, 250, 30, 1_100)).toEqual({
      timeToFirstTokenMs: 150,
      durationMs: 1_000,
      outputUnits: 30,
      outputUnitsPerSecond: 30,
    })
  })

  it('does not invent first-token timing when no token was emitted', () => {
    expect(createGenerationMetrics(100, undefined, 0, 100)).toMatchObject({
      timeToFirstTokenMs: null,
      durationMs: 0,
    })
  })
})
