import { describe, expect, it } from 'vitest'
import { chunkText, normalizeText } from './text'

describe('normalizeText', () => {
  it('normalizes line endings and collapses whitespace', () => {
    expect(normalizeText('  alpha\r\n\n beta\t gamma  ')).toBe('alpha beta gamma')
  })
})

describe('chunkText', () => {
  it('creates deterministic overlapping chunks', () => {
    expect(chunkText('abcdefghij', 6, 2)).toEqual(['abcdef', 'efghij'])
  })

  it('rejects an invalid overlap', () => {
    expect(() => chunkText('abc', 3, 3)).toThrow('smaller than chunk size')
  })
})
