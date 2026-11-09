import { type WidgetData } from '@template/shared/schemas/dashboard-board.schema';

import { themeColor } from '../../../../lib/utils/theme-color.util';

/**
 * O CRUZAMENTO DE DUAS CATEGORIAS no formato de cada gráfico de par. O servidor manda uma lista
 * de células (grupo × divisão); aqui ela vira barras empilhadas, mapa de calor ou fluxo.
 */
type Cell = WidgetData['cells'][number];

const CHART_TOKENS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

function colorAt(index: number): string {
  return themeColor(CHART_TOKENS[index % CHART_TOKENS.length] ?? '--chart-1');
}

/** As chaves em ordem de primeira aparição, com o rótulo de cada uma. */
function axis(cells: readonly Cell[], side: 'row' | 'column'): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const cell of cells) {
    const key = side === 'row' ? cell.row : cell.column;
    if (!seen.has(key)) seen.set(key, side === 'row' ? cell.rowLabel : cell.columnLabel);
  }

  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

export function toStacked(cells: readonly Cell[]) {
  const columns = axis(cells, 'column');

  return {
    series: columns.map((column, index) => ({
      key: column.key,
      label: column.label,
      color: colorAt(index),
    })),
    categories: axis(cells, 'row').map((row) => ({
      label: row.label,
      values: Object.fromEntries(
        cells.filter((cell) => cell.row === row.key).map((cell) => [cell.column, cell.value]),
      ),
    })),
  };
}

export function toHeatmap(cells: readonly Cell[]) {
  return {
    rows: axis(cells, 'row').map((row) => row.label),
    columns: axis(cells, 'column').map((column) => column.label),
    cells: cells.map((cell) => ({
      row: cell.rowLabel,
      column: cell.columnLabel,
      value: cell.value,
    })),
  };
}

/** Fluxo da primeira categoria para a segunda: os nós das duas pontas e as faixas entre eles. */
export function toSankey(cells: readonly Cell[]) {
  const rows = axis(cells, 'row');
  const columns = axis(cells, 'column');

  return {
    nodes: [
      ...rows.map((row, index) => ({
        id: `a:${row.key}`,
        label: row.label,
        color: colorAt(index),
      })),
      ...columns.map((column, index) => ({
        id: `b:${column.key}`,
        label: column.label,
        color: colorAt(index + rows.length),
      })),
    ],
    links: cells.map((cell) => ({
      from: `a:${cell.row}`,
      to: `b:${cell.column}`,
      value: cell.value,
    })),
  };
}
