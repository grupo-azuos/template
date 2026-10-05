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

  it('still draws the block when it has no content yet', () => {
    render(<AzuosCollapsible data={{ title: 'Filtros avançados' }} state={{ isOpen: true }} />);

    expect(screen.getByRole('button', { name: /Filtros avançados/ })).toBeInTheDocument();
  });
});
