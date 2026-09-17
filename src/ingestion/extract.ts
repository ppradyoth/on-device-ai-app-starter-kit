import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { normalizeText } from './text'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

async function extractPdf(file: File): Promise<string> {
  const document = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  try {
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' '),
      )
    }
    return normalizeText(pages.join(' '))
  } finally {
    await document.cleanup()
  }
}

export async function extractText(file: File): Promise<string> {
  if (extensionOf(file.name) === '.pdf') return extractPdf(file)
  return normalizeText(await file.text())
}
