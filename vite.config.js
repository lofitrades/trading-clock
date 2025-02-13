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
  }
})
