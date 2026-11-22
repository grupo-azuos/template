import { type WidgetData } from '@template/shared/schemas/dashboard-board.schema';

import { type BoardItem } from '../../../../lib/utils/board-link.util';

/**
 * O ITEM CLICADO NUM BLOCO, de volta à CHAVE do grupo. O gráfico devolve o que desenhou (o rótulo:
 * o nome da pessoa, "Atualizações"); o recorte precisa da chave que o servidor agrupou (o id da
 * pessoa, "updated") — é ela que a lista compara.
 */
type Series = WidgetData['series'];
type Cells = WidgetData['cells'];

/** O grupo de um rótulo. Rótulo que não está na série é a própria chave (o rótulo de texto). */
export function itemOfLabel(series: Series, label: string): BoardItem {
  const found = series.find((item) => item.label === label);

  return { key: found?.key ?? label, label };
}

/** O cruzamento de um rótulo de linha e, quando veio, um de coluna — os blocos de par. */
export function cellItemOf(cells: Cells, rowLabel: string, columnLabel?: string): BoardItem {
  const row = cells.find((cell) => cell.rowLabel === rowLabel);
  if (columnLabel === undefined) return { key: row?.row ?? rowLabel, label: rowLabel };
  const column = cells.find((cell) => cell.columnLabel === columnLabel);

  return {
    key: row?.row ?? rowLabel,
    label: rowLabel,
    key2: column?.column ?? columnLabel,
    label2: columnLabel,
  };
}

/**
 * Um nó do fluxo: `a:` é do agrupamento, `b:` da divisão (`toSankey`). O nó leva só a dimensão
 * dele; a outra fica aberta.
 */
export function sankeyItemOf(cells: Cells, nodeId: string): BoardItem | null {
  if (nodeId.startsWith('a:')) {
    const key = nodeId.slice(2);
    const label = cells.find((cell) => cell.row === key)?.rowLabel ?? key;

    return { key, label };
  }
  if (!nodeId.startsWith('b:')) return null;
  const key2 = nodeId.slice(2);
  const label2 = cells.find((cell) => cell.column === key2)?.columnLabel ?? key2;

  return { key: null, key2, label2 };
}

/**
 * O ponto do tempo clicado (o instante que o gráfico de área desenhou) de volta ao grupo: o dia
 * (`2026-11-20`) ou o mês (`2026-11`, desenhado no dia 1º). Fora da série, nada.
 */
export function timeItemOf(series: Series, at: string): BoardItem | null {
  const day = at.slice(0, 10);
  const found = series.find((item) => item.key === day || `${item.key}-01` === day);

  return found ? { key: found.key, label: found.label } : null;
}
