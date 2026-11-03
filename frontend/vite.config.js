import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Proxy API/socket to local backend (works for LAN clients hitting this Vite host) */
const backendTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-aria-components',
      '@internationalized/date',
      'ag-grid-react',
      'ag-grid-community',
      'antd',
      // Calendar page — must be prebundled or Vite serves broken / missing dep URLs (504)
      '@fullcalendar/core',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/list',
      '@fullcalendar/interaction',
    ],
  },
  server: {
    host: '0.0.0.0', // IPv4 (detects busy port on Windows instead of dual-stack :: bypass)
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: backendTarget,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/uploads': { target: backendTarget, changeOrigin: true },
      '/socket.io': { target: backendTarget, ws: true, changeOrigin: true },
    },
  },
});
