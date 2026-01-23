/**
 * vite.config.js
 *
 * Purpose: Vite configuration for the Time 2 Trade React app with performance optimizations.
 * Key responsibility and main functionality: Configures code-splitting, lazy loading, and vendor chunking to reduce initial payload and improve FCP/LCP metrics.
 *
 * Changelog:
 * v1.3.0 - 2026-01-23 - BEP PERFORMANCE: Add advanced code-splitting with route-based chunks. Lazy load Firebase features, separate MUI components. Set chunk size warnings and minification. Preload critical chunks only.
 * v1.2.0 - 2025-12-17 - Added manual chunks for React/MUI/Firebase vendors to shrink initial payload and improve first paint.
 * v1.1.0 - 2025-12-16 - Switched base to root for Firebase Hosting custom domain deployment.
 * v1.0.0 - 2025-12-16 - Initial configuration with React plugin and dev server proxy.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // BEP: Reduce chunk size warnings and minimize CSS/JS
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // BEP: Aggressive code-splitting to reduce initial payload
        manualChunks: (id) => {
          // React and React-DOM separate chunk
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          
          // MUI Material UI - separate large vendor
          if (id.includes('node_modules/@mui/material')) {
            return 'mui-vendor';
          }
          
          // MUI Icons - separate as it's large
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Firebase - split into auth and firestore chunks
          if (id.includes('node_modules/firebase/auth')) {
            return 'firebase-auth';
          }
          if (id.includes('node_modules/firebase/firestore')) {
            return 'firebase-firestore';
          }
          if (id.includes('node_modules/firebase/')) {
            return 'firebase-core';
          }
          
          // Emotion CSS-in-JS
          if (id.includes('node_modules/@emotion')) {
            return 'emotion-vendor';
          }
          
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
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
        }
      }
    }
  }
})
