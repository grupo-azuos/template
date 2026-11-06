/// <reference types="@rsbuild/core/types" />

/* As variáveis públicas continuam com o prefixo `VITE_` (ver `rsbuild.config.ts`). */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ACCOUNT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
