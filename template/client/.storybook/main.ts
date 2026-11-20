import { createRequire } from 'node:module';
import { dirname } from 'node:path';

import { type StorybookConfig } from 'storybook-react-rsbuild';

/* No monorepo o `storybook` fica na raiz e o `storybook-react-rsbuild` dentro de `client/`: pelo
   nome, o Storybook não acha o framework ("Cannot find package"). Pelo caminho absoluto, acha. */
const require = createRequire(import.meta.url);
const packagePath = (name: string) => dirname(require.resolve(`${name}/package.json`));

const config: StorybookConfig = {
  /* Primeiro as páginas de texto (Introdução e Fundamentos), depois as stories de cada componente. */
  stories: ['./docs/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  /* Do Storybook 9 em diante controls, actions, viewport e backgrounds vêm no core. Ficam o a11y
     (exigido pelo CONTRIBUTING em todo primitivo) e o docs, que monta as páginas de texto de cada
     componente (o que é, quando usar, quando não usar) e as páginas MDX dos fundamentos. */
  addons: [packagePath('@storybook/addon-a11y'), packagePath('@storybook/addon-docs')],
  /* O Storybook usa o mesmo `rsbuild.config.ts` do app: aliases, Tailwind e `VITE_*` iguais. */
  framework: { name: packagePath('storybook-react-rsbuild'), options: {} },
  /* A pasta `public` do Storybook leva a logo e o ícone da aba (os do sistema ficam com o app). */
  staticDirs: ['./public'],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  /* O ícone da aba do navegador: a arara da Azuos, no lugar do ícone do Storybook. */
  managerHead: (head) => `${head ?? ''}
    <link rel="icon" type="image/svg+xml" href="./storybook-favicon.svg" />
    <title>Azuos · Design System</title>`,
};

export default config;
