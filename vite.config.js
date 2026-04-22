import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MATOS',
        short_name: 'MATOS',
        description: 'Listes materiel lumiere cinema',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Cache uniquement les assets statiques
        // Pas de cache agressif sur les appels Supabase
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: []
      }
    })
  ],
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  server: {
    port: 5173,
    host: true
  }
});
