
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // On ne définit plus process.env.API_KEY ici pour éviter de l'exposer dans le bundle JS
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
