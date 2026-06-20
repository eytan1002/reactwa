import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'https://serberonly.onrender.com',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'https://serberonly.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
