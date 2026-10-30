import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosKanbanColumn } from './azuos-kanban-column.component';

function dropEvent(id: string) {
  return { dataTransfer: { getData: () => id, setData: vi.fn() } };
}

describe('AzuosKanbanColumn', () => {
  // feliz
  it('shows the title, the count and the cards', () => {
    render(
      <AzuosKanbanColumn data={{ title: 'Testes', count: 2 }}>
        <p>Cartão A</p>
        <p>Cartão B</p>
      </AzuosKanbanColumn>,
    );

    expect(screen.getByRole('region', { name: 'Testes' })).toBeInTheDocument();
    expect(screen.getByLabelText('2 itens')).toHaveTextContent('2');
    expect(screen.getByText('Cartão B')).toBeInTheDocument();
  });

  it('reports the id of the card dropped on it', () => {
    const onDropItem = vi.fn();
    render(<AzuosKanbanColumn data={{ title: 'Deploy', count: 0 }} actions={{ onDropItem }} />);

    fireEvent.drop(screen.getByRole('region', { name: 'Deploy' }), dropEvent('7'));

    expect(onDropItem).toHaveBeenCalledWith(7);
  });

  it('offers the add button with the label of the screen', () => {
    const onAdd = vi.fn();
    render(
      <AzuosKanbanColumn
        data={{ title: 'Pendente', count: 0 }}
        ui={{ addLabel: 'Nova tarefa' }}
        actions={{ onAdd }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nova tarefa' }));

    expect(onAdd).toHaveBeenCalled();
  });

  // triste
  it('ignores something dropped that is not a card', () => {
    const onDropItem = vi.fn();
    render(<AzuosKanbanColumn data={{ title: 'Deploy', count: 0 }} actions={{ onDropItem }} />);

    fireEvent.drop(screen.getByRole('region', { name: 'Deploy' }), dropEvent('texto'));

    expect(onDropItem).not.toHaveBeenCalled();
  });

  it('has no add button when the screen does not allow adding', () => {
    render(<AzuosKanbanColumn data={{ title: 'Concluído', count: 0 }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
