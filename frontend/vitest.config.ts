import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/utilities/mentionUtils.ts',
        'src/services/mentionApi.ts',
        'src/components/noteblockplugins/Mentions.tsx',
        'src/layouts/page/Page.tsx',
        'src/services/pageApi.ts',
        'src/constants/Constants.ts',
      ],
    },
  },
  resolve: {
    alias: {
      services: '/src/services',
      utilities: '/src/utilities',
      components: '/src/components',
      contexts: '/src/contexts',
      types: '/src/types',
      layouts: '/src/layouts',
      constants: '/src/constants',
    },
  },
});
