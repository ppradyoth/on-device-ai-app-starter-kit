import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES, APP_LIMITS } from '../app/limits'
import { sha256Hex } from '../engine/hash'
import type { DocumentChunk, SourceDocument } from '../engine/types'
import { deleteDocument, listDocuments, saveDocument } from '../storage/local-db'
import { EmbeddingClient } from './embedding-client'
import { extractText } from './extract'
import { chunkText } from './text'

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

function documentKey(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}`
}

async function documentId(file: File): Promise<string> {
  const bytes = new TextEncoder().encode(documentKey(file)).buffer as ArrayBuffer
  return (await sha256Hex(bytes)).slice(0, 24)
}

function validateFile(file: File): void {
  if (
    !ACCEPTED_EXTENSIONS.includes(fileExtension(file.name) as (typeof ACCEPTED_EXTENSIONS)[number])
  ) {
    throw new Error(`${file.name}: supported files are PDF, Markdown, and text.`)
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
    throw new Error(`${file.name}: MIME type ${file.type || 'unknown'} is not allowed.`)
  }
  if (file.size > APP_LIMITS.maxFileSizeBytes) {
    throw new Error(`${file.name}: maximum file size is 20 MB.`)
  }
}

export async function ingestFiles(
  files: File[],
  embeddings: EmbeddingClient,
): Promise<SourceDocument[]> {
  if (files.length === 0) throw new Error('Choose at least one document.')
  for (const file of files) validateFile(file)

  const existing = await listDocuments()
  const newDocumentCount = files.filter(
    (file) => !existing.some((document) => document.name === file.name),
  ).length
  if (existing.length + newDocumentCount > APP_LIMITS.maxDocuments) {
    throw new Error(`The maximum is ${APP_LIMITS.maxDocuments} documents.`)
  }

  const saved: SourceDocument[] = []
  for (const file of files) {
    const id = await documentId(file)
    const text = await extractText(file)
    if (!text) throw new Error(`${file.name}: the document contains no extractable text.`)
    const texts = chunkText(text)
    const vectors = await embeddings.embed(texts)
    const chunks: DocumentChunk[] = texts.map((chunk, position) => ({
      id: `${id}-${position}`,
      documentId: id,
      sourceName: file.name,
      text: chunk,
      position,
      embedding: vectors[position],
    }))
    const document: SourceDocument = {
      id,
      name: file.name,
      mimeType: file.type || 'text/plain',
      sizeBytes: file.size,
      createdAt: Date.now(),
    }
    await saveDocument(document, chunks)
    saved.push(document)
  }
  return saved
}

export { deleteDocument }
