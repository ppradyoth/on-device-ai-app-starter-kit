import { describe, expect, it } from 'vitest'
import { DEFAULT_MODEL, validateModelDescriptor } from './model-manifest'

describe('DEFAULT_MODEL', () => {
  it('contains the selected model integrity and license metadata', () => {
    expect(() => validateModelDescriptor(DEFAULT_MODEL)).not.toThrow()
    expect(DEFAULT_MODEL.sha256).toHaveLength(64)
    expect(DEFAULT_MODEL.sourceUrl).toContain('.gguf')
  })

  it('rejects a malformed integrity value', () => {
    expect(() => validateModelDescriptor({ ...DEFAULT_MODEL, sha256: 'not-a-hash' })).toThrow(
      'Model SHA-256',
    )
  })
})
