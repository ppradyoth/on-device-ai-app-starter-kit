import type { ModelProfile } from './types'

export const DEFAULT_MODEL: ModelProfile = {
  id: 'qwen3-0.6b-q8-0',
  displayName: 'Qwen3-0.6B-GGUF',
  sourceUrl: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
  sha256: '9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031',
  sizeBytes: 639446688,
  contextSize: 32768,
  licenseName: 'Apache-2.0',
  licenseUrl: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/blob/main/LICENSE',
  quantization: 'Q8_0',
  recommendedMinimumMemory: '2 GB available browser storage and memory headroom',
  testedDevices: [],
  testedRuntimeVersion: '@wllama/wllama 3.6.1',
}

export function validateModelDescriptor(model: ModelProfile): void {
  if (!model.sourceUrl.endsWith('.gguf')) throw new Error('Model URL must point to a GGUF file.')
  if (!/^[a-f0-9]{64}$/.test(model.sha256))
    throw new Error('Model SHA-256 must be 64 lowercase hex characters.')
  if (!Number.isSafeInteger(model.sizeBytes) || model.sizeBytes <= 0) {
    throw new Error('Model size must be a positive safe integer.')
  }
  if (!Number.isSafeInteger(model.contextSize) || model.contextSize <= 0) {
    throw new Error('Model context size must be a positive safe integer.')
  }
  if (!model.licenseName || !model.licenseUrl)
    throw new Error('Model license metadata is required.')
}
