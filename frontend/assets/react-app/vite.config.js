import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/assets/react-build/',
  build: {
    outDir: '../react-build', // Se creará en frontend/assets/react-build
    emptyOutDir: true,
  }
})