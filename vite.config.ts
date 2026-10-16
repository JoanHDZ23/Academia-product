import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json,shard1,shard2}'],
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // API del backend de academia (Render). NetworkFirst con caché de respaldo.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api') ||
              /onrender\.com$/.test(url.hostname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'academia-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 200, maxAgeSeconds: 48 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Klock Academia · Horarios y Asistencia',
        short_name: 'Klock Academia',
        description: 'Planificación de clases, cursos, alumnos y profesores',
        theme_color: '#7c3aed',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'any',
        lang: 'es',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  build: {
    target: ['chrome87', 'safari14', 'firefox78', 'edge88'],
    cssTarget: ['chrome87', 'safari14', 'firefox78', 'edge88'],
  },
})
