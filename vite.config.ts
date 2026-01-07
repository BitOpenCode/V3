import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  base: '/V3/',
  plugins: [
    react(),
    nodePolyfills({
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
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    alias: {
      'evp_bytestokey': path.resolve(__dirname, 'node_modules/evp_bytestokey'),
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    },
  },
  build: {
    outDir: 'docs',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
