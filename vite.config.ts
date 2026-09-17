import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function copyOnnxRuntimeAssets() {
  return {
    name: 'copy-onnx-runtime-assets',
    apply: 'build' as const,
    closeBundle() {
      const source = resolve('node_modules/onnxruntime-web/dist')
      const destination = resolve('dist/onnxruntime')
      mkdirSync(destination, { recursive: true })
      for (const file of [
        'ort-wasm-simd-threaded.asyncify.mjs',
        'ort-wasm-simd-threaded.asyncify.wasm',
      ]) {
        copyFileSync(resolve(source, file), resolve(destination, file))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyOnnxRuntimeAssets()],
})
