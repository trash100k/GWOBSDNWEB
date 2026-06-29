import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GAELWORX · ONE FORGE
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: {
    // three.js doesn't tree-shake well — split the heavy deps into their own
    // vendor chunks so the 3D stack caches independently of app code and the
    // initial parse shrinks (perf research: docs/research/webgl-performance-cwv.md).
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@react-three') || id.includes('postprocessing') || id.includes('troika'))
            return 'r3f'
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('lenis')) return 'lenis'
          if (id.includes('leva')) return 'leva'
          return 'vendor'
        },
      },
    },
  },
})
