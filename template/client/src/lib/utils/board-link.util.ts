import { type BoardDrill, boardDrillSchema } from '@template/shared/schemas/board-drill.schema';
import {
  type BoardFilterValues,
  DATA_SOURCES,
  type DataSource,
  type DataSourceKey,
  type Widget,
  widgetIsClickable,
  widgetQueryOf,
} from '@template/shared/schemas/dashboard-board.schema';

/** O item clicado: o valor do agrupamento e, nos blocos de par, o da divisão. Nulo: o bloco todo. */
export type BoardItem = {
  key: string | null;
  label?: string | null;
  key2?: string | null;
  label2?: string | null;
};

export type BoardLink = { to: string; search: { drill: BoardDrill } };

/** A tela que lista a fonte (`screen`, no arquivo das fontes do projeto) — nula sem uma. */
export function drillScreenOf(source: DataSourceKey): string | null {
  return (DATA_SOURCES[source] as DataSource).screen ?? null;
}

/**
 * Para onde vai o clique num item de um bloco, com o recorte inteiro: a pergunta do bloco (com os
 * filtros do painel que valem nele) e o item clicado. Fonte sem lista, ou bloco com os itens não
 * clicáveis, devolve `null` — e não promete o clique.
 */
export function boardLinkOf(
  widget: Widget,
  values: BoardFilterValues,
  item: BoardItem,
): BoardLink | null {
  const screen = drillScreenOf(widget.source);
  if (!screen || !widgetIsClickable(widget)) return null;
  const drill = boardDrillSchema.parse({
    ...widgetQueryOf(widget, values),
    key: item.key,
    key2: item.key2 ?? null,
    label: item.label ?? null,
    label2: item.label2 ?? null,
    title: widget.title,
  });

  return { to: screen, search: { drill } };
}
