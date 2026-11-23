import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosCollapsible } from './azuos-collapsible.component';

describe('AzuosCollapsible', () => {
  // feliz
  it('keeps the title in sight and the content hidden until asked', () => {
    render(
      <AzuosCollapsible data={{ title: 'Filtros avançados' }}>
        <p>Prazo e responsável</p>
      </AzuosCollapsible>,
    );

    expect(screen.getByRole('button', { name: /Filtros avançados/ })).toBeInTheDocument();
    expect(screen.queryByText('Prazo e responsável')).not.toBeInTheDocument();
  });

  it('opens on a click and tells the screen who asked', async () => {
    const onOpenChange = vi.fn();
    render(
      <AzuosCollapsible data={{ title: 'Filtros avançados' }} actions={{ onOpenChange }}>
        <p>Prazo e responsável</p>
      </AzuosCollapsible>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Filtros avançados/ }));

    expect(screen.getByText('Prazo e responsável')).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('can be born open, for the block that is almost always consulted', () => {
    render(
      <AzuosCollapsible data={{ title: 'Filtros avançados' }} state={{ isOpen: true }}>
        <p>Prazo e responsável</p>
      </AzuosCollapsible>,
    );

    expect(screen.getByText('Prazo e responsável')).toBeInTheDocument();
  });

  it('shows the badge beside the title and keeps the aside action out of the toggle', async () => {
    const onOpenChange = vi.fn();
    const onClear = vi.fn();
    render(
      <AzuosCollapsible
        data={{ title: 'Filtros', badge: '2 ativos' }}
        state={{ isOpen: true }}
        actions={{ onOpenChange }}
        aside={
          <button type="button" onClick={onClear}>
            Limpar filtros
          </button>
        }
      >
        <p>Prazo e responsável</p>
      </AzuosCollapsible>,
    );

    expect(screen.getByRole('button', { name: /Filtros.*2 ativos/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(onClear).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByText('Prazo e responsável')).toBeInTheDocument();
  });

  // triste
  /* Desabilitado tem de recusar o clique: um bloco que abre vazio enquanto os filtros carregam faz
     a pessoa concluir que não existe filtro nenhum. */
  it('does not open while disabled', async () => {
    const onOpenChange = vi.fn();
    render(
      <AzuosCollapsible
        data={{ title: 'Filtros avançados' }}
        state={{ isDisabled: true }}
        actions={{ onOpenChange }}
      >
        <p>Prazo e responsável</p>
      </AzuosCollapsible>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Filtros avançados/ }));

    expect(screen.queryByText('Prazo e responsável')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('draws no badge when there is nothing to count', () => {
    render(<AzuosCollapsible data={{ title: 'Filtros', badge: '' }} />);

    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
  });

  it('still draws the block when it has no content yet', () => {
    render(<AzuosCollapsible data={{ title: 'Filtros avançados' }} state={{ isOpen: true }} />);

    expect(screen.getByRole('button', { name: /Filtros avançados/ })).toBeInTheDocument();
  });
});
