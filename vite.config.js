import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GAELWORX · ONE FORGE
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
})
