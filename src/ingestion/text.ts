import { APP_LIMITS } from '../app/limits'

export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\s+/g, ' ').trim()
}

export function chunkText(
  text: string,
  chunkSize: number = APP_LIMITS.chunkSize,
  overlap: number = APP_LIMITS.chunkOverlap,
): string[] {
  if (!text) return []
  if (overlap >= chunkSize) throw new Error('Chunk overlap must be smaller than chunk size.')

  const chunks: string[] = []
  const step = chunkSize - overlap
  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(text.length, start + chunkSize)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
  }
  return chunks
}
