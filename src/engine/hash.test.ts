import { describe, expect, it } from 'vitest'
import { ModelIntegrityError, sha256Hex, verifyModelBlob } from './hash'

describe('sha256Hex', () => {
  it('hashes model bytes deterministically', async () => {
    expect(await sha256Hex(new TextEncoder().encode('hello').buffer)).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })
})

describe('ModelIntegrityError', () => {
  it('exposes a safe mismatch message', () => {
    expect(new ModelIntegrityError('expected', 'actual').message).toContain(
      'integrity check failed',
    )
  })

  it('rejects bytes that do not match the expected model hash', async () => {
    await expect(verifyModelBlob(new Blob(['wrong']), '0'.repeat(64))).rejects.toThrow(
      'integrity check failed',
    )
  })
})
