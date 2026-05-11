import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// During development, proxy API calls to the FastAPI backend on :8000.
// This makes everything same-origin so HttpOnly cookies + CSRF "just work".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/libraries': 'http://localhost:8000',
      '/discogs': 'http://localhost:8000',
    },
  },
});
