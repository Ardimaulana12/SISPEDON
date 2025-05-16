import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // tailwindcss(),
  ],
  // configure docker to acces locally
  server: {
    watch: {
      usePolling: true, // <- wajib untuk Docker
    },
    // host: "0.0.0.0",
    host: true,
    port: 5173,
  },
})
