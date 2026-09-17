import type { LocalAIEngine } from './types'
import { MockEngine } from './mock-engine'
import { WllamaEngine } from './wllama-engine'

export function createEngine(): LocalAIEngine {
  return import.meta.env.VITE_E2E_MOCK === 'true' ? new MockEngine() : new WllamaEngine()
}
