import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type Widget } from '@template/shared/schemas/dashboard-board.schema';

import {
  CELLS_FIXTURE,
  widgetFixture,
  widgetResultFixture,
} from '../../../../lib/utils/dashboard-fixture.util';
import {
  AzuosBoardWidget,
  type AzuosBoardWidgetProps,
  measureOf,
} from './azuos-board-widget.component';
import { toHeatmap, toSankey, toStacked } from './widget-pairs.util';

function makeProps(widget: Partial<Widget> = {}, isEditing = false): AzuosBoardWidgetProps {
  return {
    data: {
      widget: widgetFixture({
        kind: 'list',
        title: 'Por quem cadastrou',
        groupBy: 'createdBy',
        ...widget,
      }),
      result: widgetResultFixture(),
      filterName: null,
    },
    state: { isEditing },
    actions: { onEdit: vi.fn(), onRemove: vi.fn() },
  };
}

describe('AzuosBoardWidget', () => {
  // feliz
  it('lists the groups in order, with what it counts and the scope as chips', () => {
    const props = makeProps({ onlyMine: true, period: '7d' });
    render(<AzuosBoardWidget {...props} data={{ ...props.data, filterName: 'Atrasadas' }} />);

    expect(screen.getByRole('heading', { name: 'Por quem cadastrou' })).toBeInTheDocument();
    expect(screen.getByText('Contagem de tarefas por quem cadastrou')).toBeInTheDocument();
    for (const chip of ['12 tarefas', 'Só os meus', 'Últimos 7 dias', 'Atrasadas']) {
      expect(screen.getByText(chip)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '1ºConcluída7',
      '2ºEm andamento3',
      '3ºA fazer2',
    ]);
  });

  // feliz
  it('shows one card per group when grouped, and one total card otherwise', () => {
    const { rerender } = render(
      <AzuosBoardWidget {...makeProps({ kind: 'stats', groupBy: 'status' })} />,
    );
    expect(screen.getByText('Concluída')).toBeInTheDocument();

    rerender(<AzuosBoardWidget {...makeProps({ kind: 'stats', groupBy: null, title: 'Total' })} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  // feliz
  it('offers handle and configure while editing, and removes only on a second click', () => {
    const props = makeProps({}, true);
    render(<AzuosBoardWidget {...props} />);

    expect(screen.getByRole('button', { name: 'Arrastar Por quem cadastrou' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Configurar Por quem cadastrou' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover Por quem cadastrou' }));
    expect(props.actions.onRemove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remover?' }));

    expect(props.actions.onEdit).toHaveBeenCalledWith('w1');
    expect(props.actions.onRemove).toHaveBeenCalledWith('w1');
  });

  // feliz
  it('switches the chart from the card itself, with the current one checked', () => {
    const props = makeProps({}, true);
    const onChangeKind = vi.fn();
    render(<AzuosBoardWidget {...props} actions={{ ...props.actions, onChangeKind }} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Trocar o gráfico de Por quem cadastrou' }),
    );
    expect(screen.getByRole('radio', { name: 'Ranking' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Rosca' }));

    expect(onChangeKind).toHaveBeenCalledWith('w1', 'donut');
  });

  // feliz
  it('puts up to four cards, one per group, inside the Zuzu hero', () => {
    const props = makeProps({ kind: 'hero', title: 'Tarefas', groupBy: 'status' });
    render(<AzuosBoardWidget {...props} />);

    // O nome do bloco vai embaixo do total, e não numa linha própria: cabe em dois andares.
    expect(screen.getByRole('region', { name: '12 tarefas' })).toHaveTextContent('Tarefas');
    for (const label of ['Concluída', 'Em andamento', 'A fazer']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  // feliz
  it('expands the chart full screen outside edit mode', () => {
    render(<AzuosBoardWidget {...makeProps()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Expandir Por quem cadastrou' }));

    expect(screen.getByRole('dialog', { name: 'Por quem cadastrou' })).toBeInTheDocument();
  });

  // triste
  it('does not expand inside the editor preview', () => {
    const props = makeProps();
    render(<AzuosBoardWidget {...props} state={{ isEditing: false, isPreview: true }} />);

    expect(screen.queryByRole('button', { name: /^Expandir/ })).not.toBeInTheDocument();
  });

  // feliz
  it('renders the newer charts without breaking (gauge, radar, treemap and pair charts)', () => {
    for (const kind of ['radial', 'radar', 'treemap', 'stacked', 'heatmap', 'sankey'] as const) {
      const props = makeProps({ kind, title: kind });
      const { unmount } = render(
        <AzuosBoardWidget
          {...props}
          data={{ ...props.data, result: widgetResultFixture({ cells: CELLS_FIXTURE }) }}
        />,
      );
      expect(screen.getByRole('heading', { name: kind })).toBeInTheDocument();
      unmount();
    }
  });

  // triste
  it('shows the query error in place of the chart, and offers no edit outside edit mode', () => {
    const props = makeProps({ kind: 'column', groupBy: 'status' });
    render(
      <AzuosBoardWidget
        {...props}
        data={{ ...props.data, result: { data: null, isLoading: false, error: 'Filtro inválido' } }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Filtro inválido');
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
  });

  // triste
  it('says an empty list has nothing, and describes the measure without the numbers', () => {
    const props = makeProps();
    render(
      <AzuosBoardWidget
        {...props}
        data={{ ...props.data, result: widgetResultFixture({ total: 0, series: [] }) }}
      />,
    );

    expect(screen.getByText('Nada para mostrar.')).toBeInTheDocument();
    expect(measureOf({ ...props.data, result: { data: null, isLoading: true, error: null } })).toBe(
      'Contagem de tarefas por quem cadastrou',
    );
  });
});

describe('pair chart cells', () => {
  // feliz
  it('turns into stacked series, heatmap cells and sankey links', () => {
    const stacked = toStacked(CELLS_FIXTURE);
    expect(stacked.series.map((series) => series.label)).toEqual([
      'Alterou a tarefa',
      'Cadastrou a tarefa',
    ]);
    expect(stacked.categories).toEqual([
      { label: 'Ana', values: { 'task.updated': 9, 'task.created': 3 } },
      { label: 'Bia', values: { 'task.updated': 5, 'task.created': 4 } },
    ]);
    expect(toHeatmap(CELLS_FIXTURE)).toMatchObject({
      rows: ['Ana', 'Bia'],
      columns: ['Alterou a tarefa', 'Cadastrou a tarefa'],
    });
    const sankey = toSankey(CELLS_FIXTURE);
    expect(sankey.nodes).toHaveLength(4);
    expect(sankey.links[0]).toEqual({ from: 'a:ana', to: 'b:task.updated', value: 9 });
  });

  // triste
  it('has nothing to draw without cells', () => {
    expect(toStacked([])).toEqual({ series: [], categories: [] });
    expect(toSankey([])).toEqual({ nodes: [], links: [] });
  });
});
