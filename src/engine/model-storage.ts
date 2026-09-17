const DATABASE_NAME = 'on-device-ai-models'
const DATABASE_VERSION = 1
const STORE_NAME = 'models'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open model storage.'))
  })
}

export async function readCachedModel(modelId: string): Promise<Blob | undefined> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, 'readonly')
      .objectStore(STORE_NAME)
      .get(modelId)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error ?? new Error('Unable to read the cached model.'))
  })
}

export async function writeCachedModel(modelId: string, model: Blob): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .put(model, modelId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Unable to cache the model.'))
  })
}

export async function clearCachedModels(): Promise<void> {
  if (!('indexedDB' in globalThis)) return
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Unable to clear model storage.'))
  })
}
