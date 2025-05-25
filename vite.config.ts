import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/walettonScanner/',
  plugins: [
    react(),
    nodePolyfills({
      // Здесь можно настроить, какие полифиллы включать/исключать
      // Например, включить только нужные:
      // include: ['buffer'],
      // exclude: ['http'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Удалена старая конфигурация define для Buffer
});
