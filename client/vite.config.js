import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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