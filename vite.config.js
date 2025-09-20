// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On Vercel, use the default base (i.e., remove './')
export default defineConfig({
  plugins: [react()],
  // base: '/'  // (optional) default is fine; no need to set
})
