import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  // GitHub Pages configuration
  base: process.env.NODE_ENV === 'production' ? 'https://techguyty.github.io/workout-app/' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
