import { type Widget, type WidgetData } from '@template/shared/schemas/dashboard-board.schema';

import { type WidgetState } from '../view-models/use-dashboard-board.model';

/**
 * Os blocos e os números de mentira dos testes e das histórias do dashboard — um lugar só, para
 * um campo novo no contrato não obrigar a mexer em cada arquivo. São das fontes de EXEMPLO do
 * template (tarefas e o movimento delas).
 */
export function widgetFixture(overrides: Partial<Widget> = {}): Widget {
  return {
    id: 'w1',
    kind: 'column',
    title: 'Tarefas por status',
    source: 'tasks',
    groupBy: 'status',
    splitBy: null,
    filterId: null,
    onlyMine: false,
    period: 'all',
    window: null,
    ...overrides,
  };
}

export const SERIES_FIXTURE: WidgetData['series'] = [
  { key: 'done', label: 'Concluída', value: 7 },
  { key: 'doing', label: 'Em andamento', value: 3 },
  { key: 'todo', label: 'A fazer', value: 2 },
];

export const CELLS_FIXTURE: WidgetData['cells'] = [
  { row: 'ana', rowLabel: 'Ana', column: 'task.updated', columnLabel: 'Alterou a tarefa', value: 9 },
  { row: 'ana', rowLabel: 'Ana', column: 'task.created', columnLabel: 'Cadastrou a tarefa', value: 3 },
  { row: 'bia', rowLabel: 'Bia', column: 'task.updated', columnLabel: 'Alterou a tarefa', value: 5 },
  { row: 'bia', rowLabel: 'Bia', column: 'task.created', columnLabel: 'Cadastrou a tarefa', value: 4 },
];

/** Quem o filtro "Pessoa" e o construtor de filtro oferecem nos testes e nas histórias. */
export const PEOPLE_FIXTURE = [
  { id: 'u-ana', name: 'Ana Souza', photo: null },
  { id: 'u-bia', name: 'Bia Marques', photo: null },
];

export function widgetDataFixture(overrides: Partial<WidgetData> = {}): WidgetData {
  return { total: 12, grandTotal: 20, series: SERIES_FIXTURE, cells: [], ...overrides };
}

export function widgetResultFixture(overrides: Partial<WidgetData> = {}): WidgetState {
  return { data: widgetDataFixture(overrides), isLoading: false, error: null };
}
