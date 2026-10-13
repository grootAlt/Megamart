import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin /api in dev, so no CORS or env juggling locally.
    proxy: { '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:4000' },
  },
});
