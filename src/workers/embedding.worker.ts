import { pipeline } from '@huggingface/transformers'

interface EmbeddingWorkerRequest {
  id: number
  texts: string[]
}

type EmbeddingPipeline = ((
  text: string,
  options: { pooling: 'mean'; normalize: true },
) => Promise<{ data: Float32Array }>) & { dispose?: () => Promise<void> }

let extractor: EmbeddingPipeline | undefined

async function getExtractor(): Promise<EmbeddingPipeline> {
  extractor ??= (await pipeline('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX', {
    dtype: 'q8',
  })) as unknown as EmbeddingPipeline
  return extractor
}

self.onmessage = async ({ data }: MessageEvent<EmbeddingWorkerRequest>) => {
  try {
    const model = await getExtractor()
    const embeddings: number[][] = []
    for (const text of data.texts) {
      const output = await model(text, { pooling: 'mean', normalize: true })
      embeddings.push(Array.from(output.data))
    }
    self.postMessage({ id: data.id, embeddings })
  } catch (error) {
    self.postMessage({
      id: data.id,
      error: error instanceof Error ? error.message : 'Embedding failed.',
    })
  }
}
