import { type Decorator, type Preview } from '@storybook/react';

import '../src/lib/theme/tokens.css';
import './docs.css';
import { AzuosDocsPage } from './docs-page';

/** Claro ou escuro, pelo botão da barra do Storybook — o mesmo `data-theme` que o app usa. */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;

  return (
    <div className="bg-background text-foreground p-6 font-sans">
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
    docs: { page: AzuosDocsPage, toc: { headingSelector: 'h2, h3' } },
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
