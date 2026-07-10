import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, forward API + webhook calls to the local Unstuck API server (test mode).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5186,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:4242',
      '/webhook': 'http://localhost:4242',
      '/health': 'http://localhost:4242',
    },
  },
});
