import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/assets': resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
        },
      },
    },
  },
})
