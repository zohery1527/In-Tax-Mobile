// https://vite.dev/config/
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://in-tax-mobile.onrender.com',
        changeOrigin: true
      }
    }
  }
})
