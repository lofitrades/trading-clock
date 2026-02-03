/**
 * vite.config.js
 *
 * Purpose: Vite configuration for the Time 2 Trade React app with performance optimizations.
 * Key responsibility and main functionality: Configures code-splitting, lazy loading, and vendor chunking to reduce initial payload and improve FCP/LCP metrics. Ensures robust HMR WebSocket connection for hot module reloading.
 *
 * Changelog:
 * v1.10.0 - 2026-02-02 - BEP HMR FIX: Removed hardcoded HMR port config to allow Vite to auto-sync port between server and client. Fixes "WebSocket closed without opened" error when server falls back to alternate port.
 * v1.9.0 - 2026-01-28 - BEP HMR FIX: Added dns.setDefaultResultOrder('verbatim') per Vite docs to fix localhost DNS resolution mismatch between Node.js and browser. This ensures consistent IP address resolution for HMR WebSocket connections.
 * v1.8.0 - 2026-01-27 - BEP HMR CRITICAL FIX: Refactored HMR config with environment variable support and fallback. Changed strictPort: true → false to allow fallback to adjacent ports if 5173 is unavailable. Added 'localhost' to allowedHosts. Made HMR config environment-aware for better cross-environment support (ngrok, Docker, CI/CD). Fixes WebSocket connection failures.
 * v1.7.0 - 2026-01-27 - BEP HMR FIX: Added explicit hmr configuration with protocol/host/port/clientPort to fix WebSocket connection failures. Ensures Vite HMR WebSocket connects properly on localhost:5173 for hot reloading during development.
 * v1.6.0 - 2026-01-27 - BEP CONSOLE FIX: Added Cross-Origin-Opener-Policy: unsafe-none header to dev server. Fixes Firebase Auth SDK warning "COOP policy would block window.closed call". Firebase popup auth needs to check window.closed from opened window, which COOP: same-origin would block.
 * v1.5.0 - 2026-01-23 - CRITICAL FIX: Remove emotion/react-is manual chunking - causes circular dependency. Let Vite handle naturally.
 * v1.4.0 - 2026-01-23 - CRITICAL FIX: Remove aggressive manualChunks causing react-is/emotion AsyncMode error. Use simpler vendor splitting.
 * v1.3.0 - 2026-01-23 - BEP PERFORMANCE: Add advanced code-splitting with route-based chunks. Lazy load Firebase features, separate MUI components. Set chunk size warnings and minification. Preload critical chunks only.
 * v1.2.0 - 2025-12-17 - Added manual chunks for React/MUI/Firebase vendors to shrink initial payload and improve first paint.
 * v1.1.0 - 2025-12-16 - Switched base to root for Firebase Hosting custom domain deployment.
 * v1.0.0 - 2025-12-16 - Initial configuration with React plugin and dev server proxy.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// BEP: Fix localhost DNS resolution mismatch between Node.js and browser
// Per Vite docs: Node.js under v17 reorders DNS-resolved addresses by default
// This ensures consistent 'localhost' resolution for HMR WebSocket connections
dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // BEP: Dedupe React and @emotion to prevent multiple instances
    // Fixes "Invalid hook call" and "@emotion/react already loaded" errors
    dedupe: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
    ],
  },
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
    strictPort: false,
    allowedHosts: ['.ngrok-free.app', 'localhost'],
    headers: {
      // BEP: Disable COOP to allow Firebase Auth popup window checking
      // Firebase SDK checks window.closed property from auth popup, which would be blocked by COOP: same-origin
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
    // BEP: Let Vite auto-configure HMR WebSocket to match actual server port
    // Hardcoding port causes "WebSocket closed without opened" when server falls back to alternate port
    hmr: true,
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
