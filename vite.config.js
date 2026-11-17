import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /AI-mapping/; local dev stays at /
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/AI-mapping/' : '/',
  server: { port: 5173 },
}))
