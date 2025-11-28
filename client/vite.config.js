import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This plugin fixes the "process is not defined" and "Buffer" errors automatically
    nodePolyfills(),
  ],
  define: {
    global: 'window',
  },
  server: {
    allowedHosts: true, 
  },
})