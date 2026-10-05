import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosBreadcrumb } from './azuos-breadcrumb.component';

describe('AzuosBreadcrumb', () => {
  // feliz
  it('shows the trail and names it for a screen reader', () => {
    render(
      <AzuosBreadcrumb
        data={{
          items: [{ label: 'Tarefas', href: '/tasks' }, { label: 'Revisar contrato' }],
        }}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Você está em' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toHaveAttribute('href', '/tasks');
  });

  /* Clicar na página atual não levaria a lugar nenhum: link morto faz alguém clicar duas vezes e
     concluir que a tela travou. */
  it('does not turn the current page into a link', () => {
    render(
      <AzuosBreadcrumb
        data={{
          items: [{ label: 'Tarefas', href: '/tasks' }, { label: 'Revisar contrato' }],
        }}
      />,
    );

    const current = screen.getByText('Revisar contrato');

    /* O componente baixado marca a parada atual com `aria-current` e `aria-disabled`; o que ela
       NAO tem e um destino para onde ir. */
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).not.toHaveAttribute('href');
  });

  it('turns a level without a destination into plain text', () => {
    render(
      <AzuosBreadcrumb
        data={{
          items: [
            { label: 'Tarefas', href: '/tasks' },
            { label: 'Arquivadas' },
            { label: 'Revisar contrato' },
          ],
        }}
      />,
    );

    const level = screen.getByText('Arquivadas');

    expect(level).not.toHaveAttribute('href');
    expect(level).not.toHaveAttribute('aria-current');
  });

  // triste
  /* Trilha vazia acontece na raiz de uma tela. Uma barra vazia empurraria o conteúdo alguns pixels
     e a tela nasceria desalinhada das outras. */
  it('draws nothing when there is no level', () => {
    const { container } = render(<AzuosBreadcrumb data={{ items: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('draws no separator when there is a single level', () => {
    render(<AzuosBreadcrumb data={{ items: [{ label: 'Tarefas' }] }} />);

    expect(screen.getByText('Tarefas')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
