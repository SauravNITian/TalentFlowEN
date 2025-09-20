// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On Vercel, don't override base — defaults work fine
export default defineConfig({
  plugins: [react()],
})
