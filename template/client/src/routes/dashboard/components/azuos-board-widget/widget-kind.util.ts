import {
  CalendarDays,
  CalendarRange,
  ChartArea,
  Donut,
  ChartBar,
  ChartColumnBig,
  ChartColumnDecreasing,
  ChartLine,
  Flower2,
  PieChart,
  ChartColumn,
  ChartColumnStacked,
  ChartPie,
  Gauge,
  Grid3x3,
  Hash,
  LayoutGrid,
  ListOrdered,
  type LucideIcon,
  Radar,
  Sparkles,
  Workflow,
} from 'lucide-react';

import { type WidgetKind } from '@template/shared/schemas/dashboard-board.schema';

/**
 * A CARA DE CADA TIPO DE BLOCO — o ícone e o nome curto que aparecem na lateral de montar o
 * painel e na grade de escolha do editor. O nome longo (com a explicação) continua no contrato.
 */
export const WIDGET_KIND_LOOK: Record<WidgetKind, { icon: LucideIcon; short: string }> = {
  stats: { icon: Hash, short: 'Números' },
  hero: { icon: Sparkles, short: 'Destaque' },
  column: { icon: ChartColumn, short: 'Colunas' },
  bar: { icon: ChartBar, short: 'Barras' },
  donut: { icon: ChartPie, short: 'Rosca' },
  area: { icon: ChartArea, short: 'Linha' },
  calendar: { icon: CalendarDays, short: 'Calendário' },
  list: { icon: ListOrdered, short: 'Ranking' },
  radar: { icon: Radar, short: 'Radar' },
  treemap: { icon: LayoutGrid, short: 'Blocos' },
  radial: { icon: Gauge, short: 'Medidor' },
  stacked: { icon: ChartColumnStacked, short: 'Empilhado' },
  heatmap: { icon: Grid3x3, short: 'Calor' },
  sankey: { icon: Workflow, short: 'Fluxo' },
  agenda: { icon: CalendarRange, short: 'Agenda' },
  pie: { icon: PieChart, short: 'Pizza' },
  rose: { icon: Flower2, short: 'Rosa' },
  halfDonut: { icon: Gauge, short: 'Meia-rosca' },
  pareto: { icon: ChartColumnDecreasing, short: 'Pareto' },
  cumulative: { icon: ChartLine, short: 'Acumulado' },
  grouped: { icon: ChartColumnBig, short: 'Lado a lado' },
  ringCard: { icon: Donut, short: 'Card com anel' },
};

/**
 * OS SEIS MAIS USADOS, à frente; os outros dezesseis num segundo grupo. Vinte e duas opções com o
 * mesmo peso demoram para escolher (Lei de Hick) — o comum fica à mão, o raro continua a um passo.
 */
export const MAIN_KINDS: readonly WidgetKind[] = [
  'column',
  'bar',
  'area',
  'donut',
  'stats',
  'list',
];
export const OTHER_KINDS: readonly WidgetKind[] = [
  'hero',
  'agenda',
  'radar',
  'treemap',
  'radial',
  'ringCard',
  'stacked',
  'heatmap',
  'calendar',
  'sankey',
  'pie',
  'rose',
  'halfDonut',
  'pareto',
  'cumulative',
  'grouped',
];

/** O tamanho em que cada tipo nasce na grade — o que a lateral mostra ("2 × 2 casas"). */
export function defaultSizeOf(kind: WidgetKind): { w: number; h: number } {
  // O destaque compacto (Zuzu, o total e a linha de quatro cards) cabe em dois andares.
  if (kind === 'hero') return { w: 4, h: 2 };
  if (kind === 'stats') return { w: 4, h: 1 };
  // A agenda mostra o mês inteiro (até seis semanas): três andares.
  if (kind === 'agenda') return { w: 4, h: 3 };
  if (kind === 'radial' || kind === 'list') return { w: 1, h: 2 };
  // O card com anel é um card só, como os de número: um andar.
  if (kind === 'ringCard') return { w: 1, h: 1 };

  return { w: 2, h: 2 };
}

/** Onde entra o bloco posto com um clique (sem arrastar): embaixo de tudo, no tamanho do tipo. */
export function bottomPlace(
  layout: readonly { y: number; h: number }[],
  kind: WidgetKind,
): { x: number; y: number; w: number; h: number } {
  const bottom = Math.max(0, ...layout.map((item) => item.y + item.h));

  return { x: 0, y: bottom, ...defaultSizeOf(kind) };
}

/** O título que o bloco novo já traz — quem monta só ajusta (Lei de Tesler). */
export function suggestedTitle(kind: WidgetKind, noun: string, groupLabel: string | null): string {
  if (kind === 'hero') return 'Destaque';
  const subject = noun.charAt(0).toUpperCase() + noun.slice(1);

  return groupLabel ? `${subject} por ${groupLabel.toLowerCase()}` : subject;
}
