import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist-extension',
  },
});
