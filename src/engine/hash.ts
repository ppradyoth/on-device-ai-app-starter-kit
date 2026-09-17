export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyModelBlob(blob: Blob, expectedHash: string): Promise<void> {
  const actualHash = await sha256Hex(await blob.arrayBuffer())
  if (actualHash !== expectedHash) throw new ModelIntegrityError(expectedHash, actualHash)
}

export class ModelIntegrityError extends Error {
  constructor(expected: string, actual: string) {
    super(`Model integrity check failed. Expected ${expected}, received ${actual}.`)
    this.name = 'ModelIntegrityError'
  }
}
