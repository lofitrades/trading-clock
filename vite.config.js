import { defineConfig } from 'vite' 
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/trading-clock/', // 👈 Set this to your GitHub repository name
  server: {
    host: true, // Allows external access (0.0.0.0)
    port: 5173, // Ensure the port is correct
    strictPort: true, // Ensures it runs on 5173
    allowedHosts: ['.ngrok-free.app'], // 👈 Allows ngrok tunnels
    proxy: {
      // Proxy API requests to bypass CORS
      '/api/news': {
        target: 'https://www.jblanked.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/news/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Log headers being sent
            console.log('Authorization header:', req.headers.authorization || 'MISSING');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
