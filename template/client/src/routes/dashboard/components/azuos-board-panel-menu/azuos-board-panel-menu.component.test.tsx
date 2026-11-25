import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosBoardPanelMenu } from './azuos-board-panel-menu.component';

function setup(canEdit: boolean) {
  const actions = { onView: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onRemove: vi.fn() };
  render(<AzuosBoardPanelMenu data={{ title: 'Tarefas' }} state={{ canEdit }} actions={actions} />);

  return actions;
}

describe('AzuosBoardPanelMenu', () => {
  // feliz
  it('offers view, edit, duplicate and remove to whoever can edit', async () => {
    const actions = setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Menu de Tarefas' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }));

    expect(actions.onDuplicate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menuitem', { name: 'Duplicar' })).not.toBeInTheDocument();
  });

  // feliz
  it('opens the block on view', async () => {
    const actions = setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Menu de Tarefas' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ver' }));

    expect(actions.onView).toHaveBeenCalledTimes(1);
  });

  // triste
  it('shows only view to whoever cannot edit', async () => {
    setup(false);
    await userEvent.click(screen.getByRole('button', { name: 'Menu de Tarefas' }));

    expect(screen.getByRole('menuitem', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Remover' })).not.toBeInTheDocument();
  });
});
