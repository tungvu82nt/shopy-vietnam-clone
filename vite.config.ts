import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': process.env,
  },
  esbuild: {
    // Đảm bảo React được xử lý đúng cách
    jsxInject: `import React from 'react'`,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ["5173-idg4n8nmx26sl6b0aex5q-c4c81a99.manusvm.computer", "5174-idg4n8nmx26sl6b0aex5q-c4c81a99.manusvm.computer"],
  },
});
