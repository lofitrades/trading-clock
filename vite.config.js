/**
 * vite.config.js
 *
 * Purpose: Vite configuration for the Time 2 Trade React app with performance optimizations.
 * Key responsibility and main functionality: Configures code-splitting, lazy loading, and vendor chunking to reduce initial payload and improve FCP/LCP metrics.
 *
 * Changelog:
 * v1.5.0 - 2026-01-23 - CRITICAL FIX: Remove emotion/react-is manual chunking - causes circular dependency. Let Vite handle naturally.
 * v1.4.0 - 2026-01-23 - CRITICAL FIX: Remove aggressive manualChunks causing react-is/emotion AsyncMode error. Use simpler vendor splitting.
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
        // BEP: Conservative chunking - only split large independent vendors
        // DO NOT split emotion/react-is - causes circular dependency errors
        manualChunks: (id) => {
          // MUI Icons - large and independent, safe to split
          if (id.includes('node_modules/@mui/icons-material')) {
            return 'mui-icons';
          }
          
          // Firebase Firestore - largest chunk, lazy loaded anyway
          if (id.includes('node_modules/firebase/firestore')) {
            return 'firebase-firestore';
          }
          
          // Firebase core (app, auth, analytics)
          if (id.includes('node_modules/firebase/')) {
            return 'firebase-core';
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
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('proxy error', err);
          });
        }
      }
    }
  }
})
