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

  /* O destaque enquanto um cartão passa por cima só existe onde soltar faz sentido: numa coluna
     sem `onDropItem`, o navegador nem recebe o `preventDefault` — e por isso não aceita o solto. */
  it('highlights while a card hovers over a column that accepts drops', () => {
    render(<AzuosKanbanColumn data={{ title: 'Deploy', count: 0 }} actions={{ onDropItem: vi.fn() }} />);
    const column = screen.getByRole('region', { name: 'Deploy' });

    const dragOver = fireEvent.dragOver(column);
    expect(dragOver).toBe(false);
    expect(column.className).toContain('bg-accent/80');

    fireEvent.dragLeave(column);
    expect(column.className).not.toContain('bg-accent/80');
  });

  it('does not accept a drag over a column that cannot receive cards', () => {
    render(<AzuosKanbanColumn data={{ title: 'Concluído', count: 0 }} />);
    const column = screen.getByRole('region', { name: 'Concluído' });

    const dragOver = fireEvent.dragOver(column);

    expect(dragOver).toBe(true);
    expect(column.className).not.toContain('bg-accent/80');
  });

  it('paints the header with the tone of the stage', () => {
    render(<AzuosKanbanColumn data={{ title: 'Erro', count: 1 }} ui={{ tone: 'danger' }} />);

    expect(screen.getByRole('heading', { name: 'Erro' }).parentElement?.className).toContain(
      'bg-destructive',
    );
  });
});
