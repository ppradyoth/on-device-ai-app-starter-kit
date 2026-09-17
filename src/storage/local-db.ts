import type { DocumentChunk, SourceDocument } from '../engine/types'

const DATABASE_NAME = 'on-device-ai-local'
const DATABASE_VERSION = 1
const DOCUMENTS_STORE = 'documents'
const CHUNKS_STORE = 'chunks'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DOCUMENTS_STORE)) {
        database.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(CHUNKS_STORE)) {
        database.createObjectStore(CHUNKS_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open local storage.'))
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

export async function listDocuments(): Promise<SourceDocument[]> {
  const database = await openDatabase()
  return requestResult(
    database.transaction(DOCUMENTS_STORE, 'readonly').objectStore(DOCUMENTS_STORE).getAll(),
  )
}

export async function listChunks(): Promise<DocumentChunk[]> {
  const database = await openDatabase()
  return requestResult(
    database.transaction(CHUNKS_STORE, 'readonly').objectStore(CHUNKS_STORE).getAll(),
  )
}

export async function saveDocument(
  document: SourceDocument,
  chunks: DocumentChunk[],
): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, CHUNKS_STORE], 'readwrite')
    transaction.objectStore(DOCUMENTS_STORE).put(document)
    for (const chunk of chunks) transaction.objectStore(CHUNKS_STORE).put(chunk)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save document.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Document save was aborted.'))
  })
}

export async function deleteDocument(documentId: string): Promise<void> {
  const database = await openDatabase()
  const chunks = await listChunks()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, CHUNKS_STORE], 'readwrite')
    transaction.objectStore(DOCUMENTS_STORE).delete(documentId)
    for (const chunk of chunks) {
      if (chunk.documentId === documentId) transaction.objectStore(CHUNKS_STORE).delete(chunk.id)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to delete document.'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Document deletion was aborted.'))
  })
}

export async function clearLocalDocumentData(): Promise<void> {
  if (!('indexedDB' in globalThis)) return
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([DOCUMENTS_STORE, CHUNKS_STORE], 'readwrite')
    transaction.objectStore(DOCUMENTS_STORE).clear()
    transaction.objectStore(CHUNKS_STORE).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Unable to clear document data.'))
  })
}
