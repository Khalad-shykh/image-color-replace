import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ isPreview }) => ({
  // `vite preview` mimics the static host: no SPA fallback, real 404 page.
  appType: isPreview ? 'mpa' : 'spa',
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    pool: 'vmThreads',
    css: false,
  },
}));
