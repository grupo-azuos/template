import {
  type BoardFilter,
  type DashboardScope,
  type LayoutItem,
  type Widget,
} from '@template/shared/schemas/dashboard-board.schema';

/**
 * O PAINEL PADRÃO de cada contexto — o que aparece enquanto ninguém montou o seu. É DADO do
 * projeto (regra `dashboard-standard`): cada sistema troca pelos blocos das fontes dele.
 *
 * Os do template são de exemplo, sobre as tarefas: os números por status, o que entrou no tempo,
 * quem cadastrou e o movimento da semana.
 */
type WidgetSeed = Omit<Widget, 'id' | 'filterId' | 'splitBy' | 'onlyMine' | 'period' | 'window'> &
  Partial<Pick<Widget, 'splitBy' | 'onlyMine' | 'period' | 'window'>>;

const widget = (id: string, seed: WidgetSeed): Widget => ({
  id,
  filterId: null,
  splitBy: null,
  onlyMine: false,
  period: 'all',
  window: null,
  ...seed,
});

const TEAM: { widgets: Widget[]; layout: LayoutItem[] } = {
  widgets: [
    widget('tarefas', { kind: 'stats', title: 'Tarefas', source: 'tasks', groupBy: 'status' }),
    widget('status', {
      kind: 'donut',
      title: 'Tarefas por status',
      source: 'tasks',
      groupBy: 'status',
    }),
    widget('entrada', {
      kind: 'area',
      title: 'Tarefas cadastradas por mês',
      source: 'tasks',
      groupBy: 'createdMonth',
    }),
    widget('quem-cadastrou', {
      kind: 'bar',
      title: 'Quem cadastrou',
      source: 'tasks',
      groupBy: 'createdBy',
    }),
    widget('movimento-semana', {
      kind: 'stacked',
      title: 'Movimento da semana, por pessoa',
      source: 'activity',
      groupBy: 'actor',
      splitBy: 'action',
      period: '7d',
    }),
  ],
  layout: [
    { i: 'tarefas', x: 0, y: 0, w: 4, h: 1 },
    { i: 'status', x: 0, y: 1, w: 2, h: 2 },
    { i: 'entrada', x: 2, y: 1, w: 2, h: 2 },
    { i: 'quem-cadastrou', x: 0, y: 3, w: 2, h: 2 },
    { i: 'movimento-semana', x: 2, y: 3, w: 2, h: 2 },
  ],
};

const PERSONAL: { widgets: Widget[]; layout: LayoutItem[] } = {
  widgets: [
    widget('minhas-tarefas', {
      kind: 'stats',
      title: 'Minhas tarefas',
      source: 'tasks',
      groupBy: 'status',
      onlyMine: true,
    }),
    widget('meu-movimento', {
      kind: 'list',
      title: 'Meu movimento no mês',
      source: 'activity',
      groupBy: 'action',
      onlyMine: true,
      period: 'month',
    }),
  ],
  layout: [
    { i: 'minhas-tarefas', x: 0, y: 0, w: 4, h: 1 },
    { i: 'meu-movimento', x: 0, y: 1, w: 2, h: 2 },
  ],
};

/** O da equipe já vem com "Pessoa" e "Período"; o pessoal só com "Período". */
const TEAM_FILTERS: BoardFilter[] = [
  { id: 'pessoa', kind: 'person', label: 'Pessoa' },
  { id: 'periodo', kind: 'period', label: 'Período' },
];
const PERSONAL_FILTERS: BoardFilter[] = [{ id: 'periodo', kind: 'period', label: 'Período' }];

export function defaultBoard(scope: DashboardScope): {
  widgets: Widget[];
  layout: LayoutItem[];
  filters: BoardFilter[];
} {
  if (scope === 'personal') return { ...PERSONAL, filters: PERSONAL_FILTERS };

  return { ...TEAM, filters: TEAM_FILTERS };
}
