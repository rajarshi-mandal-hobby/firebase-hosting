import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from '@nabla/vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    eslint(), // Modern ESLint plugin with proper TypeScript support
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
