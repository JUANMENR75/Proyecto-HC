import { defineConfig } from 'vite'
import react           from '@vitejs/plugin-react'
import { VitePWA }     from 'vite-plugin-pwa'
import mkcert          from 'vite-plugin-mkcert'
import path            from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const r = (...p: string[]) => path.resolve(__dirname, ...p)

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg', 'favicon.ico',
        'robots.txt', 'apple-touch-icon.png'
      ],
      manifest: {
        name:             'Sistema de Gestión de Medicamentos',
        short_name:       'SGM',
        description:      'Control de inventario y entregas de medicamentos',
        theme_color:      '#ffffff',
        background_color: '#ffffff',
        display:          'standalone',
        start_url:        '/',
        icons: [
          { src: 'SGM_ICON.png', sizes: '192x192', type: 'image/png' },
          { src: 'SGM_ICON.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'SGM.png', sizes: '512x512', type: 'image/png' },
          { src: 'SGM.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          {
            src: 'SGM.png',
            sizes: '2202x2202',
            type: 'image/png',
            label: 'Sistema de Gestión de Medicamentos'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            url: '/dashboard',
            icons: [{ src: 'SGM_ICON.png', sizes: '192x192' }]
          }
        ],
        categories: ['healthcare', 'productivity'],
        dir: 'ltr',
        iarc_rating_id: '',
        lang: 'es',
        orientation: 'any',
        prefer_related_applications: false,
        scope: '/'
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        navigateFallback: 'index.html',
        skipWaiting: false,
        clientsClaim: false,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}'
        ],
        globDirectory: 'dist',
        globIgnores: ['**/node_modules/**/*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    }),

    mkcert()
  ],

  resolve: {
    alias: { '@': r('./src') }
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: 'C:/Users/jm740/.vite-plugin-mkcert/dev.pem',
      cert: 'C:/Users/jm740/.vite-plugin-mkcert/cert.pem',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
