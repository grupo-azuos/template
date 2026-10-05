import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosPanelCard } from './azuos-panel-card.component';

describe('AzuosPanelCard', () => {
  // feliz
  it('shows the title as a heading, so the screen has an outline', () => {
    render(
      <AzuosPanelCard data={{ title: 'Tarefas por situação' }}>
        <p>conteúdo</p>
      </AzuosPanelCard>,
    );

    expect(screen.getByRole('heading', { name: 'Tarefas por situação' })).toBeInTheDocument();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('shows the hint when there is one', () => {
    render(
      <AzuosPanelCard data={{ title: 'Criadas', hint: 'Exclui as arquivadas' }}>
        <p>conteúdo</p>
      </AzuosPanelCard>,
    );

    expect(screen.getByText('Exclui as arquivadas')).toBeInTheDocument();
  });

  it('puts the tools next to the title', () => {
    render(
      <AzuosPanelCard data={{ title: 'Criadas' }} tools={<button type="button">Semana</button>}>
        <p>conteúdo</p>
      </AzuosPanelCard>,
    );

    expect(screen.getByRole('button', { name: 'Semana' })).toBeInTheDocument();
  });

  // triste
  /* Sem dica o bloco não ganha um parágrafo vazio: ele empurraria o conteúdo alguns pixels, e
     dois blocos lado a lado (um com dica, outro sem) nasceriam desalinhados. */
  it('draws no hint paragraph when there is no hint', () => {
    const { container } = render(
      <AzuosPanelCard data={{ title: 'Criadas' }}>
        <p>conteúdo</p>
      </AzuosPanelCard>,
    );

    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('draws no tools area when there are no tools', () => {
    render(
      <AzuosPanelCard data={{ title: 'Criadas' }}>
        <p>conteúdo</p>
      </AzuosPanelCard>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
