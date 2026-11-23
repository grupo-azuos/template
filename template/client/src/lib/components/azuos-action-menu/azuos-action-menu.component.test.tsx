import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosActionMenu } from './azuos-action-menu.component';

const ITEMS = [
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Excluir', icon: Trash2, isDestructive: true, separatorBefore: true },
];

describe('AzuosActionMenu', () => {
  // feliz
  it('tells the screen which action was chosen', async () => {
    const onSelect = vi.fn();
    render(<AzuosActionMenu data={{ label: 'Ações', items: ITEMS }} actions={{ onSelect }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ações' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Excluir' }));

    expect(onSelect).toHaveBeenCalledWith('delete');
  });

  // feliz
  it('shows only the three dots and keeps the label as the accessible name', () => {
    render(
      <AzuosActionMenu
        data={{ label: 'Ações da linha', items: ITEMS }}
        ui={{ isIconOnly: true }}
        actions={{ onSelect: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ações da linha' })).not.toHaveTextContent(
      'Ações da linha',
    );
  });

  // triste
  it('does not open while disabled', async () => {
    render(
      <AzuosActionMenu
        data={{ label: 'Ações', items: ITEMS }}
        state={{ isDisabled: true }}
        actions={{ onSelect: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ações' }));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
