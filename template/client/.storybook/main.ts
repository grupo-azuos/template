import { type StorybookConfig } from 'storybook-react-rsbuild';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  /* `addon-essentials` não existe mais: do Storybook 9 em diante controls, actions,
     viewport, backgrounds e docs vêm no core, e o pacote foi descontinuado. Sobra o a11y,
     que continua sendo addon — e é o que o CONTRIBUTING exige em todo primitivo. */
  addons: ['@storybook/addon-a11y'],
  /* O Storybook usa o mesmo `rsbuild.config.ts` do app: aliases, Tailwind e `VITE_*` iguais. */
  framework: { name: 'storybook-react-rsbuild', options: {} },
  core: { disableTelemetry: true },
  typescript: { reactDocgen: 'react-docgen-typescript' },
};

export default config;
