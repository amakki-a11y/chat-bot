import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../public'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/widget/widget-entry.jsx'),
      output: {
        entryFileNames: 'widget.js',
        // Bundle everything into one file
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    // No CSS extraction — inject inline
    cssCodeSplit: false,
    // Minify for production
    minify: 'esbuild',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
