import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [],
      },
      manifest: {
        name: 'RiffCard - 歌練習アプリ',
        short_name: 'RiffCard',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#e94560',
        icons: [
          { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
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
