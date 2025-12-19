/**
 * vite.config.js
 *
 * Purpose: Vite configuration for the Time 2 Trade React app, including build base path and dev server settings.
 * Key responsibility and main functionality: Sets root-relative asset base for Firebase Hosting, configures dev server and proxy for API calls.
 *
 * Changelog:
 * v1.2.0 - 2025-12-17 - Added manual chunks for React/MUI/Firebase vendors to shrink initial payload and improve first paint.
 * v1.1.0 - 2025-12-16 - Switched base to root for Firebase Hosting custom domain deployment.
 * v1.0.0 - 2025-12-16 - Initial configuration with React plugin and dev server proxy.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/api/news': {
        target: 'https://www.jblanked.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/news/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
          });
        }
      }
    }
  }
})
