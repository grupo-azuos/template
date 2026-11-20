import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/**
 * A MOLDURA DO STORYBOOK no padrão Apple: a logo da Azuos no lugar da do Storybook, o azul do
 * sistema como cor principal, o fundo cinza e os cantos grandes. Segue o claro ou o escuro do
 * computador de quem abre.
 */
const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

const SYSTEM_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif";

addons.setConfig({
  theme: create({
    base: isDark ? 'dark' : 'light',
    brandTitle: 'Azuos · Design System',
    brandUrl: './',
    brandImage: isDark ? './storybook-logo-dark.svg' : './storybook-logo.svg',
    brandTarget: '_self',
    colorPrimary: isDark ? '#0A84FF' : '#007AFF',
    colorSecondary: isDark ? '#0A84FF' : '#007AFF',
    appBg: isDark ? '#161618' : '#F2F2F7',
    appContentBg: isDark ? '#222225' : '#FFFFFF',
    appPreviewBg: isDark ? '#161618' : '#F2F2F7',
    appBorderColor: isDark ? '#333336' : '#E3E3E8',
    appBorderRadius: 14,
    fontBase: SYSTEM_FONT,
    textColor: isDark ? '#F5F5F7' : '#1D1D1F',
    textMutedColor: isDark ? '#98989D' : '#6E6E73',
    barBg: isDark ? '#222225' : '#FFFFFF',
    inputBg: isDark ? '#2C2C2F' : '#ECECF0',
    inputBorder: 'transparent',
    inputBorderRadius: 10,
  }),
  sidebar: { showRoots: true },
});
