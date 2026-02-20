import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'app',
  resolve: {
    alias: {
      '@lib/db': path.resolve(__dirname, 'lib/db/src'),
      '@lib/audio': path.resolve(__dirname, 'lib/audio/src'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
