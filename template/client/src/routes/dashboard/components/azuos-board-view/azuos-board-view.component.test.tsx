import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import { widgetFixture } from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardView, type AzuosBoardViewProps } from './azuos-board-view.component';

function makeProps(overrides: Partial<AzuosBoardViewProps['state']> = {}): AzuosBoardViewProps {
  return {
    data: {
      scope: 'team',
      scopes: [
        { value: 'team', label: 'Equipe' },
        { value: 'manager', label: 'Gestor' },
        { value: 'personal', label: 'Pessoal' },
      ],
      widgets: [
        widgetFixture({
          id: 'a',
          kind: 'list',
          title: 'Movimento',
          source: 'activity',
          groupBy: 'actor',
        }),
      ],
      layout: [{ i: 'a', x: 0, y: 0, w: 4, h: 2 }],
      results: {},
      editing: null,
      preview: null,
      updatedAt: null,
      filters: [],
      boardFilters: [{ id: 'periodo', kind: 'period', label: 'Período' }],
      filterValues: EMPTY_BOARD_FILTER_VALUES,
      people: [],
    },
    state: {
      isLoading: false,
      isEditing: false,
      isSaving: false,
      isRefreshing: false,
      canEdit: true,
      canAdd: true,
      error: null,
      isFilterScreenOpen: false,
      ...overrides,
    },
    actions: {
      onScopeChange: vi.fn(),
      onRefresh: vi.fn(),
      onStartEdit: vi.fn(),
      onCancelEdit: vi.fn(),
      onSave: vi.fn(),
      onLayoutChange: vi.fn(),
      onNewWidget: vi.fn(),
      onEditWidget: vi.fn(),
      onCloseEditor: vi.fn(),
      onSubmitWidget: vi.fn(),
      onRemoveWidget: vi.fn(),
      onOpenFilters: vi.fn(),
      onPreviewChange: vi.fn(),
      onFilterValueChange: vi.fn(),
      onAddBoardFilter: vi.fn(),
      onRemoveBoardFilter: vi.fn(),
    },
  };
}

describe('AzuosBoardView', () => {
  // feliz
  it('switches board, refreshes and starts editing while viewing', () => {
    const props = makeProps();
    render(<AzuosBoardView {...props} />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(/painel padrão do sistema/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gestor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar painel' }));
    expect(props.actions.onScopeChange).toHaveBeenCalledWith('manager');
    expect(props.actions.onRefresh).toHaveBeenCalled();
    expect(props.actions.onStartEdit).toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Filtros do painel' })).toBeInTheDocument();
  });

  // feliz
  it('opens the full-screen builder with kinds, filters, restore and save while editing', () => {
    const props = makeProps({ isEditing: true });
    render(<AzuosBoardView {...props} />);

    expect(screen.getByRole('dialog', { name: 'Montar o painel Equipe' })).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pôr bloco Rosca' }));
    fireEvent.click(screen.getByRole('button', { name: 'Montar filtros' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(props.actions.onNewWidget).toHaveBeenCalledWith('donut', { x: 0, y: 2, w: 2, h: 2 });
    expect(props.actions.onOpenFilters).toHaveBeenCalled();
    expect(props.actions.onSave).toHaveBeenCalled();
    expect(props.actions.onCancelEdit).toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'Mais usados' })).toBeInTheDocument();
  });

  // triste
  it('lets read-only users only view, and locks the kinds at the block limit', () => {
    const { rerender } = render(<AzuosBoardView {...makeProps({ canEdit: false })} />);
    expect(screen.queryByRole('button', { name: 'Editar painel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<AzuosBoardView {...makeProps({ isEditing: true, canAdd: false })} />);
    expect(screen.getByRole('button', { name: 'Pôr bloco Colunas' })).toBeDisabled();
    expect(screen.getByText('O painel já tem o máximo de blocos.')).toBeInTheDocument();
  });

  // triste
  it('shows the error and the loading state in place of the canvas', () => {
    const { rerender } = render(
      <AzuosBoardView {...makeProps({ error: 'Sem permissão para este painel' })} />,
    );
    expect(screen.getByText('Sem permissão para este painel')).toBeInTheDocument();

    rerender(<AzuosBoardView {...makeProps({ isLoading: true })} />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o painel');
  });
});
