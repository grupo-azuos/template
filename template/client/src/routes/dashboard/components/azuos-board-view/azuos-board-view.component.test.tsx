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
      filterCounts: {},
      weight: 4,
      refreshEvery: '300000',
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
      onClearFilterValues: vi.fn(),
      onBoardFilterDisplayChange: vi.fn(),
      onBoardFilterWidthChange: vi.fn(),
      onBoardFilterPlaceChange: vi.fn(),
      onDuplicateWidget: vi.fn(),
      onRefreshEveryChange: vi.fn(),
      onOpenItem: vi.fn(),
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
    expect(screen.getByRole('group', { name: 'Período do painel' })).toBeInTheDocument();
  });

  // feliz
  it('puts the time picker and the "refresh every" at the top, as in Grafana', () => {
    const props = makeProps();
    render(<AzuosBoardView {...props} />);

    expect(screen.getByRole('group', { name: 'Período do painel' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'Atualizar a cada' }));
    fireEvent.click(screen.getByRole('option', { name: '1 minuto' }));

    expect(props.actions.onRefreshEveryChange).toHaveBeenCalledWith('60000');
  });

  // feliz
  it('builds the board in place, with add, settings, discard and save on a toolbar', () => {
    const props = makeProps({ isEditing: true });
    render(<AzuosBoardView {...props} />);

    expect(screen.getByRole('toolbar', { name: 'Montando o painel' })).toHaveTextContent(
      'Editando o painel Equipe · 4 de 24 pontos',
    );
    expect(screen.queryByRole('button', { name: 'Editar painel' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Bloco' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Responsável' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar painel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(props.actions.onNewWidget).toHaveBeenCalled();
    expect(props.actions.onAddBoardFilter).toHaveBeenCalledWith('person');
    expect(props.actions.onSave).toHaveBeenCalled();
    expect(props.actions.onCancelEdit).toHaveBeenCalled();
  });

  // feliz
  it('opens the board settings on the side, with the list of filters', () => {
    render(<AzuosBoardView {...makeProps({ isEditing: true })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));

    expect(screen.getByRole('dialog', { name: 'Configurações do painel' })).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Os filtros do painel, na ordem da barra' }),
    ).toBeInTheDocument();
  });

  // triste
  it('lets read-only users only view, and locks a new block at the quota', () => {
    const { rerender } = render(<AzuosBoardView {...makeProps({ canEdit: false })} />);
    expect(screen.queryByRole('button', { name: 'Editar painel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();

    rerender(<AzuosBoardView {...makeProps({ isEditing: true, canAdd: false })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByRole('menuitem', { name: 'Bloco' })).toBeDisabled();
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
