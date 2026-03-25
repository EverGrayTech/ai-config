import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@evergraytech/ai-config/react': resolve(rootDir, '../../src/react.ts'),
      '@evergraytech/ai-config': resolve(rootDir, '../../src/index.ts'),
      '@evergraytech/ai-config/styles/base.css': resolve(rootDir, '../../styles/base.css'),
    },
  },
});
