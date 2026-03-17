import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const port = Number(process.env.VITE_PORT ?? 3000);

export default defineConfig({
  base: '/games/lobster/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port,
    open: true,
  },
});