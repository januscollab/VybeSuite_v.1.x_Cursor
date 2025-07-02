import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true, // Enable source maps for production builds
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    // Existing proxy configuration
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        headers: {
          'Origin': 'https://api.anthropic.com'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Enable raw text imports for prompt files
  assetsInclude: ['**/*.txt'],
  // Enhanced dev tools configuration
  css: {
    devSourcemap: true // Enable CSS source maps
  },
  // Better error overlay
  clearScreen: false
});