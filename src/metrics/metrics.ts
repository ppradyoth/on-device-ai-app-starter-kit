export interface GenerationMetrics {
  timeToFirstTokenMs: number | null
  durationMs: number
  outputUnits: number
  outputUnitsPerSecond: number
}

export function createGenerationMetrics(
  startedAt: number,
  firstTokenAt: number | undefined,
  outputUnits: number,
  finishedAt: number,
): GenerationMetrics {
  const durationMs = Math.max(0, finishedAt - startedAt)
  return {
    timeToFirstTokenMs: firstTokenAt === undefined ? null : Math.max(0, firstTokenAt - startedAt),
    durationMs,
    outputUnits,
    outputUnitsPerSecond: durationMs === 0 ? 0 : (outputUnits / durationMs) * 1000,
  }
}
