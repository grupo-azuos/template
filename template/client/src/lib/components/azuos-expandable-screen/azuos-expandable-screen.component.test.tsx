import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosExpandableScreen } from './azuos-expandable-screen.component';

describe('AzuosExpandableScreen', () => {
  // feliz
  it('opens on top of everything with title, content and footer, closing on Esc', () => {
    const onClose = vi.fn();
    render(
      <AzuosExpandableScreen
        data={{ title: 'Montar filtro' }}
        state={{ isOpen: true }}
        actions={{ onClose }}
        footer={<button type="button">Salvar</button>}
      >
        <p>Canvas</p>
      </AzuosExpandableScreen>,
    );

    expect(screen.getByRole('dialog', { name: 'Montar filtro' })).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  // triste
  /* Montar o painel → expandir um gráfico: um Esc fecha só a de cima. Antes fechava as duas, e
     fechar a de baixo era "Restaurar", que jogava o rascunho fora. */
  it('closes only the top screen on Esc when stacked', () => {
    const onCloseBottom = vi.fn();
    const onCloseTop = vi.fn();
    render(
      <>
        <AzuosExpandableScreen
          data={{ title: 'Montar o painel' }}
          state={{ isOpen: true }}
          actions={{ onClose: onCloseBottom }}
        >
          <p>Painel</p>
        </AzuosExpandableScreen>
        <AzuosExpandableScreen
          data={{ title: 'Gráfico' }}
          state={{ isOpen: true }}
          actions={{ onClose: onCloseTop }}
        >
          <p>Gráfico</p>
        </AzuosExpandableScreen>
      </>,
    );

    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Gráfico' }), { key: 'Escape' });

    expect(onCloseTop).toHaveBeenCalledTimes(1);
    expect(onCloseBottom).not.toHaveBeenCalled();
  });

  // triste
  it('does not close on Esc meant for a dialog on top (focus outside the screen)', () => {
    const onClose = vi.fn();
    render(
      <>
        <AzuosExpandableScreen
          data={{ title: 'Montar o painel' }}
          state={{ isOpen: true }}
          actions={{ onClose }}
        >
          <p>Painel</p>
        </AzuosExpandableScreen>
        <input aria-label="Campo do editor" />
      </>,
    );

    fireEvent.keyDown(screen.getByLabelText('Campo do editor'), { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  // triste
  it('renders nothing and ignores Esc when closed', () => {
    const onClose = vi.fn();
    render(
      <AzuosExpandableScreen data={{ title: 'X' }} state={{ isOpen: false }} actions={{ onClose }}>
        <p>Canvas</p>
      </AzuosExpandableScreen>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // triste
  /* Quem usa a tela passa um `actions` novo a cada render. Antes, cada letra digitada refazia o
     efeito, que devolvia o foco para a tela: o campo perdia o foco depois da primeira letra. */
  it('keeps focus in a field when the parent re-renders with new actions', () => {
    const view = (onClose: () => void) => (
      <AzuosExpandableScreen data={{ title: 'X' }} state={{ isOpen: true }} actions={{ onClose }}>
        <input aria-label="Nome" />
      </AzuosExpandableScreen>
    );
    const { rerender } = render(view(vi.fn()));
    const field = screen.getByLabelText('Nome');
    field.focus();

    const latest = vi.fn();
    rerender(view(latest));

    expect(field).toHaveFocus();
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(latest).toHaveBeenCalled();
  });
});
