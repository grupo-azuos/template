import { fileURLToPath } from 'node:url';

import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

/**
 * Em desenvolvimento a web fala com `/api` no MESMO host, e o Rsbuild encaminha para o Nest.
 *
 * Isso vale mais do que economizar uma variável: sem proxy, o navegador faz requisição
 * entre origens diferentes, e aí toda falha de CORS chega à tela como "erro de rede" — a
 * mesma mensagem genérica de quando a API está fora do ar. Com o proxy, erro de rede em
 * desenvolvimento é erro de rede de verdade.
 *
 * Em produção não há proxy: a API e o client saem da MESMA imagem, na mesma porta.
 */
const CLIENT_DIR = fileURLToPath(new URL('.', import.meta.url));

/* O Rsbuild só expõe `PUBLIC_*` por padrão. Os projetos usam `VITE_*` desde o início, e trocar o
   prefixo mudaria os `.env` de todos os ambientes: o `loadEnv` continua lendo `VITE_*` e o
   `define` entrega em `import.meta.env.VITE_*`, como antes. */
const { parsed, publicVars } = loadEnv({ cwd: CLIENT_DIR, prefixes: ['VITE_'] });

/* A porta do Nest não é segredo: ela serve só para montar o alvo do proxy. Deixá-la
   configurável evita editar este arquivo quando a 3009 está ocupada. */
const apiPort = parsed.VITE_API_PORT || process.env.VITE_API_PORT || '3009';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          routesDirectory: './src/routes',
          generatedRouteTree: './src/routeTree.gen.ts',
        }),
      ],
    },
  },
  source: {
    entry: { index: './src/main.tsx' },
    define: publicVars,
  },
  html: { template: './index.html' },
  resolve: {
    /* O client lê o `shared` pelo CÓDIGO-FONTE, não pelo `dist`: o `dist` é CommonJS para o
       Nest, e pelo fonte o HMR atravessa o pacote. `fileURLToPath`, e não `URL.pathname`: no
       Windows o `pathname` devolve "/C:/Users/..." e o caminho não resolve. */
    alias: {
      '@template/shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
      /* Só existe para o CLI do shadcn resolver import — ele gera código com "@/...". */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    /* Configurável pelo mesmo motivo da porta da API. O `strictPort` fica ligado de propósito:
       porta que muda sozinha quebraria o proxy e o CORS em silêncio. */
    port: Number(parsed.VITE_DEV_PORT || process.env.VITE_DEV_PORT || '5009'),
    strictPort: true,
    proxy: {
      '/api': { target: `http://localhost:${apiPort}`, changeOrigin: true },
    },
  },
  output: {
    distPath: { root: 'dist' },
    sourceMap: { js: 'source-map', css: true },
  },
});
