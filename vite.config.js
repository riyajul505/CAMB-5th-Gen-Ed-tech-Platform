import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Note: Proxy removed - API calls now use VITE_API_BASE_URL environment variable
  // This ensures the app works in both development and production
  server: {
    // Development server configuration (if needed)
  }
})
