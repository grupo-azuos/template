import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { type Decorator, type Preview } from '@storybook/react';
import { type PropsWithChildren } from 'react';
import { create } from 'storybook/theming';

import '../src/lib/theme/tokens.css';
import './docs.css';
import { AzuosDocsPage } from './docs-page';

const SYSTEM_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif";

/* A moldura da página Docs (título, tabela de props, blocos de código) nas cores do padrão
   Apple — clara ou grafite, igual ao tema escolhido no botão "Tema". */
const DOCS_THEMES = {
  light: create({
    base: 'light',
    appBg: '#F2F2F7',
    appContentBg: '#FFFFFF',
    appPreviewBg: '#F2F2F7',
    appBorderColor: '#E3E3E8',
    appBorderRadius: 14,
    colorPrimary: '#007AFF',
    colorSecondary: '#007AFF',
    textColor: '#1D1D1F',
    textMutedColor: '#6E6E73',
    fontBase: SYSTEM_FONT,
  }),
  dark: create({
    base: 'dark',
    appBg: '#161618',
    appContentBg: '#161618',
    appPreviewBg: '#161618',
    appBorderColor: '#333336',
    appBorderRadius: 14,
    colorPrimary: '#0A84FF',
    colorSecondary: '#0A84FF',
    textColor: '#F5F5F7',
    textMutedColor: '#98989D',
    fontBase: SYSTEM_FONT,
  }),
};

type ThemeName = keyof typeof DOCS_THEMES;

/** O tema escolhido na barra, lido dos globals do Storybook. */
function themeOf(globals: Record<string, unknown> | undefined): ThemeName {
  return globals?.theme === 'dark' ? 'dark' : 'light';
}

/** A página Docs inteira segue o tema: a moldura do Storybook e os tokens dos componentes. */
function ThemedDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const store = (
    props.context as { store?: { userGlobals?: { globals?: Record<string, unknown> } } }
  ).store;
  const theme = themeOf(store?.userGlobals?.globals);
  document.documentElement.dataset.theme = theme;

  return <DocsContainer {...props} theme={DOCS_THEMES[theme]} />;
}

/**
 * A história que roda num iframe DENTRO da página Docs (o quadro de celular) não recebe o tema da
 * barra: ela herda o da página em volta, que é a mesma origem.
 */
function parentDocsTheme(): ThemeName | null {
  if (window.parent === window) return null;
  try {
    const theme = window.parent.document.documentElement.dataset.theme;
    return theme === 'dark' || theme === 'light' ? theme : null;
  } catch {
    return null;
  }
}

/** Claro ou escuro, pelo botão da barra do Storybook — o mesmo `data-theme` que o app usa. */
const withTheme: Decorator = (Story, context) => {
  const theme = parentDocsTheme() ?? themeOf(context.globals);
  document.documentElement.dataset.theme = theme;

  /* Tela inteira (a casca do app, a tela de erro, a lista de tarefas) vai de ponta a ponta: o
     respiro de 24px em volta deslocava o menu lateral e deixava faixas da cor de fundo. */
  const isFullBleed = context.parameters.fullBleed === true;

  return (
    <div
      className={
        isFullBleed
          ? 'bg-background text-foreground min-h-screen font-sans'
          : 'bg-background text-foreground p-6 font-sans'
      }
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  /* Gera a página "Docs" de todo componente, no molde de `docs-page.tsx`: o texto de escolha, o
     exemplo, as props, o comentário técnico e as variações. */
  tags: ['autodocs'],
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Claro ou escuro',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Claro', icon: 'sun' },
          { value: 'dark', title: 'Escuro (grafite)', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    docs: {
      page: AzuosDocsPage,
      container: ThemedDocsContainer,
      toc: { headingSelector: 'h2, h3' },
    },
    /* A ordem do menu: primeiro o texto, depois os componentes por família, do mais usado ao
       mais específico; dentro de cada família, em ordem alfabética. */
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introdução',
          'Fundamentos',
          [
            'Padrão Apple',
            'Cores',
            'Forma e sombra',
            'Tipografia',
            'Organização das telas',
            'Portas de entrada do shadcn',
          ],
          'Ações',
          'Formulários',
          'Cards',
          'Gráficos e números',
          'Listas e tabelas',
          'Conteúdo e marcadores',
          'Diálogos',
          'Notificações',
          'Estados da tela',
          'Navegação e estrutura',
          'Preferências',
          'Mascote',
          'Dashboard',
          'Telas',
        ],
      },
    },
    // A equipe opera o sistema no teclado o dia inteiro; contraste e foco são requisito.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};

export default preview;
