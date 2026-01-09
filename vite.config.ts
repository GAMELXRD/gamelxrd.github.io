import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖНО: './' позволяет сайту работать, даже если он находится в папке
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 3000,
    // Настройка прокси для локальной разработки
    // Это позволяет 'npm run dev' общаться с 'netlify dev' (порт 8888)
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})