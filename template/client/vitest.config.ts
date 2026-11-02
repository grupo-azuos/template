import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // O mesmo alias do `vite.config.ts`: o teste lê o `shared` pelo código-fonte.
    alias: {
      '@template/shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    name: 'client',
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    /* Por padrão o vitest devolve vazio para todo `.css` importado — inclusive o `?raw` que o
       `theme-color.util` usa para ler o `tokens.css` como texto. Ligado, o CSS passa inteiro;
       nenhum teste importa folha de estilo, então não custa nada. */
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.tsx', 'src/routeTree.gen.ts'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
