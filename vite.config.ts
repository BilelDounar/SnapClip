import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Tauri expects a fixed dev port and serves the built assets from ../dist.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2021',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        overlay: 'overlay.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
