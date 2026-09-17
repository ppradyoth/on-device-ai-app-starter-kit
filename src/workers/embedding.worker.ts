import { env, pipeline } from '@huggingface/transformers'

const onnxBackend = env.backends.onnx as typeof env.backends.onnx & {
  wasm: { wasmPaths?: { mjs: string; wasm: string } }
}
const ortBaseUrl = import.meta.env.DEV
  ? 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/'
  : '/onnxruntime/'
onnxBackend.wasm.wasmPaths = {
  mjs: `${ortBaseUrl}ort-wasm-simd-threaded.asyncify.mjs`,
  wasm: `${ortBaseUrl}ort-wasm-simd-threaded.asyncify.wasm`,
}

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
    dtype: 'q4',
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
