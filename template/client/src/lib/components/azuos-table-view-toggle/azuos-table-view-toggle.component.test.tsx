import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AzuosTableViewToggle } from './azuos-table-view-toggle.component';

/* A preferência vive no escopo do módulo e no `localStorage`: sem limpar, um teste herda a escolha
   do anterior e o segundo passa a medir o estado errado. */
beforeEach(() => {
  window.localStorage.clear();
});

describe('AzuosTableViewToggle', () => {
  // feliz
  it('shows both formats, so the person reads the current one without clicking', () => {
    render(<AzuosTableViewToggle />);

    expect(screen.getByRole('group', { name: 'Formato da lista' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver em tabela' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver em cartões' })).toBeInTheDocument();
  });

  it('switches to cards and marks the cards button as the one in use', async () => {
    render(<AzuosTableViewToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Ver em cartões' }));

    expect(screen.getByRole('button', { name: 'Ver em cartões' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Ver em tabela' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('remembers the choice, because it is a preference of the whole system', async () => {
    const { unmount } = render(<AzuosTableViewToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver em cartões' }));
    unmount();

    render(<AzuosTableViewToggle />);

    expect(screen.getByRole('button', { name: 'Ver em cartões' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // triste
  /* Clicar no formato que já vale tem de não fazer nada. Sem a guarda, o clique inverteria a
     preferência e o botão marcado apagaria sozinho — parecendo que o controle não funciona. */
  it('does nothing when the format in use is clicked again', async () => {
    render(<AzuosTableViewToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Ver em tabela' }));

    expect(screen.getByRole('button', { name: 'Ver em tabela' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
