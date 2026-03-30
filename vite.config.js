import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Shanti Care Home Portal',
        short_name: 'ShantiCare',
        description: 'Complete nursing home & OPD management platform',
        theme_color: '#4f8cdb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        categories: ['medical', 'health'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            // API requests: network-first with 3s timeout, fallback to cache
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // API writes: queue offline, replay when back online
            urlPattern: /^https?:\/\/.*\/api\//,
            method: 'POST',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-write-queue',
                options: {
                  maxRetentionTime: 24 * 60, // 24 hours
                },
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            method: 'PUT',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-write-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            method: 'PATCH',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-write-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            method: 'DELETE',
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-write-queue',
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            // Images: cache-first with 30-day expiry
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Fonts: cache-first
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
          {
            // External APIs (OpenFDA, RxNorm): cache-first with 30min TTL
            urlPattern: /^https:\/\/(api\.fda\.gov|rxnav\.nlm\.nih\.gov)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'drug-api-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 60, // 30 min
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // Precache app shell
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Skip waiting on update
        skipWaiting: true,
        clientsClaim: true,
        // Offline fallback for navigation requests
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  base: '/',
  build: {
    chunkSizeWarningLimit: 600,
  },
})
