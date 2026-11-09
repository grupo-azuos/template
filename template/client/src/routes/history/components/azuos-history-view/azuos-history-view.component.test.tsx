import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EMPTY_HISTORY_FILTER } from '../../../../lib/view-models/use-history.model';
import { AzuosHistoryView, type AzuosHistoryViewProps } from './azuos-history-view.component';

function makeProps(overrides: Partial<AzuosHistoryViewProps['data']> = {}): AzuosHistoryViewProps {
  return {
    data: {
      entries: [
        {
          id: '7',
          kindLabel: 'Alterou a tarefa',
          tone: 'info',
          authorName: 'Ana Souza',
          createdAt: '2026-11-07T12:00:00.000Z',
          description: 'Tarefa: Ligar para o cliente\nStatus: todo → done',
        },
      ],
      filter: EMPTY_HISTORY_FILTER,
      page: 1,
      pageSize: 50,
      total: 1,
      ...overrides,
    },
    state: { isLoading: false, isFetching: false, error: null },
    actions: { onFilterChange: vi.fn(), onClearFilters: vi.fn(), onPageChange: vi.fn() },
  };
}

describe('AzuosHistoryView', () => {
  // feliz
  it('shows who did what and what changed', () => {
    render(<AzuosHistoryView {...makeProps()} />);

    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByText('Alterou a tarefa')).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText(/todo → done/)).toBeInTheDocument();
  });

  // feliz
  it('filters by what I did, by target and by action', async () => {
    const props = makeProps();
    render(<AzuosHistoryView {...props} />);

    await userEvent.click(screen.getByRole('button', { name: 'O que eu fiz' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Tarefa' }));

    expect(props.actions.onFilterChange).toHaveBeenCalledWith({ who: 'mine' });
    expect(props.actions.onFilterChange).toHaveBeenCalledWith({ targetType: 'task' });
  });

  // triste
  it('says when the scope is empty and offers to clear an active filter', async () => {
    const props = makeProps({
      entries: [],
      total: 0,
      filter: { ...EMPTY_HISTORY_FILTER, who: 'mine' },
    });
    render(<AzuosHistoryView {...props} />);

    expect(screen.getByText('Nada no histórico com estes filtros.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Limpar filtros/ }));
    expect(props.actions.onClearFilters).toHaveBeenCalled();
  });
});
