import { ChevronDown, GripVertical, Hash, Maximize2, Settings2, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { todayIso } from '@template/shared/domain/calendar-date.util';
import {
  DATA_SOURCES,
  DEFAULT_WINDOW,
  type Widget,
  WIDGET_PERIOD_LABELS,
  WIDGET_WEIGHTS,
  weightLabel,
  widgetWeight,
  windowLabel,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosAreaChart } from '../../../../lib/components/azuos-area-chart/azuos-area-chart.component';
import { AzuosCalendarChart } from '../../../../lib/components/azuos-calendar-chart/azuos-calendar-chart.component';
import { AzuosColumnChart } from '../../../../lib/components/azuos-column-chart/azuos-column-chart.component';
import { AzuosDashboardHeroCard } from '../azuos-dashboard-hero-card/azuos-dashboard-hero-card.component';
import { AzuosDonutChart } from '../../../../lib/components/azuos-donut-chart/azuos-donut-chart.component';
import { AzuosEchart } from '../../../../lib/components/azuos-echart/azuos-echart.component';
import { AzuosHeatmapChart } from '../../../../lib/components/azuos-heatmap-chart/azuos-heatmap-chart.component';
import { AzuosRadarChart } from '../../../../lib/components/azuos-radar-chart/azuos-radar-chart.component';
import { AzuosRadialChart } from '../../../../lib/components/azuos-radial-chart/azuos-radial-chart.component';
import { AzuosSankeyChart } from '../../../../lib/components/azuos-sankey-chart/azuos-sankey-chart.component';
import { AzuosStackedBarChart } from '../../../../lib/components/azuos-stacked-bar-chart/azuos-stacked-bar-chart.component';
import { AzuosStatCard } from '../../../../lib/components/azuos-stat-card/azuos-stat-card.component';
import { AzuosTreemapChart } from '../../../../lib/components/azuos-treemap-chart/azuos-treemap-chart.component';
import { AzuosExpandableScreen } from '../../../../lib/components/azuos-expandable-screen/azuos-expandable-screen.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../lib/components/azuos-popover/azuos-popover';
import { type AzuosCardHue, cardToneClasses } from '../../../../lib/utils/card-tone.util';
import { cn } from '../../../../lib/utils/cn.util';
import {
  type ChartOption,
  type ChartTheme,
  formatCount,
  resolveColor,
} from '../../../../lib/utils/echarts.util';
import { themeColor } from '../../../../lib/utils/theme-color.util';
import { type WidgetState } from '../../../../lib/view-models/use-dashboard-board.model';
import { AzuosAgendaCalendar } from '../azuos-agenda-calendar/azuos-agenda-calendar.component';
import { AzuosWidgetChart } from '../azuos-widget-chart/azuos-widget-chart.component';
import { MAIN_KINDS, OTHER_KINDS, WIDGET_KIND_LOOK } from './widget-kind.util';
import { toHeatmap, toSankey, toStacked } from './widget-pairs.util';

/**
 * UM BLOCO DO DASHBOARD — a fonte contada, desenhada no formato escolhido. O mesmo bloco serve
 * a ver e a editar: editando, ganha a alça de arrastar e os botões de editar e remover.
 */
export type AzuosBoardWidgetProps = {
  data: { widget: Widget; result: WidgetState; filterName: string | null };
  /**
   * `isPreview`: o bloco desenhado dentro do editor. Ali não expande — uma tela cheia aberta de
   * dentro do diálogo brigava com ele e com a tela de montar o painel.
   */
  state: { isEditing: boolean; isPreview?: boolean };
  actions: {
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    /** Trocar o gráfico direto no bloco, sem abrir o editor (só montando o painel). */
    onChangeKind?: (id: string, kind: Widget['kind']) => void;
  };
};

/**
 * A classe da alça de arrastar — o canvas só arrasta por ela, para o gráfico seguir clicável.
 * Nos gráficos, é o cabeçalho inteiro (alvo grande); nos cards e no destaque, a alça da barra.
 */
export const DRAG_HANDLE = 'board-drag-handle';

/** O que, dentro da alça, é clique e não começo de arrasto: os botões do cabeçalho. */
export const NO_DRAG = 'board-no-drag';

const STAT_HUES: AzuosCardHue[] = ['blue', 'green', 'yellow', 'plum'];

export function AzuosBoardWidget({ data, state, actions }: AzuosBoardWidgetProps) {
  const { widget } = data;
  const [isExpanded, setIsExpanded] = useState(false);
  /* Os cards e o destaque já são superfícies; os gráficos ganham a moldura do bloco. */
  if (widget.kind === 'stats' || widget.kind === 'hero' || widget.kind === 'ringCard') {
    return (
      <div className="relative h-full">
        <WidgetBody data={data} />
        {state.isEditing ? (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-box bg-card p-1 shadow-xs">
            <EditTools data={data} actions={actions} ui={{ withHandle: true }} />
          </div>
        ) : null}
      </div>
    );
  }

  const look = WIDGET_KIND_LOOK[widget.kind];
  const Icon = look.icon;

  /* O cartão do estúdio: a faixa do cabeçalho (ícone, título, o que conta, o recorte em selos)
     e as ferramentas dentro dele — nada solto embaixo (conectividade uniforme). */
  return (
    <section
      aria-label={widget.title}
      /* Montando, quem desenha a seleção é o canvas (contorno tracejado e puxadores). */
      className="flex h-full min-h-0 flex-col rounded-surface border border-border bg-card shadow-card"
    >
      <header
        className={cn(
          'flex items-start gap-3 border-b border-border px-4 pt-3.5 pb-3',
          state.isEditing && cn(DRAG_HANDLE, 'cursor-grab active:cursor-grabbing'),
        )}
      >
        {state.isEditing ? (
          <DragHandle data={{ title: widget.title }} />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-box bg-primary-soft text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold tracking-tight text-ink-900">{widget.title}</h3>
          <span className="block truncate text-xs text-ink-500">{measureOf(data)}</span>
          <ScopeChips data={data} />
        </span>
        <span className={cn('flex shrink-0 items-center gap-1', NO_DRAG)}>
          {state.isEditing ? <EditTools data={data} actions={actions} /> : null}
          {!state.isEditing && !state.isPreview ? (
            <AzuosActionButton
              data={{ label: `Expandir ${widget.title}` }}
              ui={{ variant: 'ghost', icon: Maximize2, isIconOnly: true }}
              actions={{ onClick: () => setIsExpanded(true) }}
            />
          ) : null}
        </span>
      </header>
      <div className="min-h-0 flex-1 p-4">
        <WidgetBody data={data} />
      </div>
      <AzuosExpandableScreen
        data={{ title: widget.title, description: measureOf(data) }}
        state={{ isOpen: isExpanded }}
        actions={{ onClose: () => setIsExpanded(false) }}
      >
        <div className="h-[70vh] p-6">
          <WidgetBody data={data} />
        </div>
      </AzuosExpandableScreen>
    </section>
  );
}

/** "Contagem de alvarás · por Status" — o que o bloco conta, e como agrupa. */
export function measureOf(data: AzuosBoardWidgetProps['data']): string {
  const { widget } = data;
  const source = DATA_SOURCES[widget.source];
  const dimensions = source.dimensions as Record<string, { label: string }>;
  const group = widget.groupBy ? dimensions[widget.groupBy]?.label : null;
  const split = widget.splitBy ? dimensions[widget.splitBy]?.label : null;
  const parts = [`Contagem de ${source.noun}`];
  if (group) parts.push(`por ${group.toLowerCase()}`);
  if (split) parts.push(`e ${split.toLowerCase()}`);

  return parts.join(' ');
}

/** O recorte em selos: o total, o período, "só os meus" e o filtro — o que mudou o número. */
function ScopeChips({ data }: { data: AzuosBoardWidgetProps['data'] }) {
  const { widget, result } = data;
  const chips = [
    result.data
      ? `${result.data.total.toLocaleString('pt-BR')} ${DATA_SOURCES[widget.source].noun}`
      : null,
    widget.period !== 'all' ? WIDGET_PERIOD_LABELS[widget.period] : null,
    widget.window ? windowLabel(widget.window) : null,
    widget.onlyMine ? 'Só os meus' : null,
    data.filterName,
  ].filter((chip): chip is string => Boolean(chip));
  if (chips.length === 0) return null;

  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {chips.map((chip, index) => (
        <span
          key={chip}
          className={cn(
            'rounded-chip px-2 py-0.5 text-xs font-semibold',
            index === 0 ? 'bg-primary-soft text-primary' : 'bg-muted text-ink-700',
          )}
        >
          {chip}
        </span>
      ))}
    </span>
  );
}

/** A alça de arrastar: um botão de verdade, de 40px, no lugar do ícone do bloco. */
function DragHandle({ data }: { data: { title: string } }) {
  return (
    <button
      type="button"
      aria-label={`Arrastar ${data.title}`}
      className={cn(
        DRAG_HANDLE,
        'flex size-10 shrink-0 cursor-grab items-center justify-center rounded-box bg-primary-soft text-primary active:cursor-grabbing',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
      )}
    >
      <GripVertical className="size-5" aria-hidden="true" />
    </button>
  );
}

/**
 * As ferramentas do bloco em edição: trocar o gráfico, configurar e — separado, e pedindo
 * confirmação — remover. A lixeira fica longe das ações frequentes (Fitts).
 */
function EditTools({
  data,
  ui,
  actions,
}: Pick<AzuosBoardWidgetProps, 'data' | 'actions'> & { ui?: { withHandle?: boolean } }) {
  const [isArmed, setIsArmed] = useState(false);
  const { widget } = data;

  return (
    <>
      {ui?.withHandle ? <DragHandle data={{ title: widget.title }} /> : null}
      {/* O peso do bloco na cota do painel, à vista de quem monta — é o que se gasta com ele. */}
      <span
        aria-label={`Peso: ${weightLabel(widgetWeight(widget))}`}
        className="shrink-0 rounded-chip bg-muted px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-ink-700"
      >
        {weightLabel(widgetWeight(widget))}
      </span>
      {actions.onChangeKind ? (
        <KindSwitch
          data={{ kind: widget.kind, title: widget.title }}
          actions={{ onChange: (kind) => actions.onChangeKind?.(widget.id, kind) }}
        />
      ) : null}
      <AzuosActionButton
        data={{ label: `Configurar ${widget.title}` }}
        ui={{ variant: 'ghost', icon: Settings2, isIconOnly: true }}
        actions={{ onClick: () => actions.onEdit(widget.id) }}
      />
      <span className="ml-2 border-l border-border pl-2">
        {isArmed ? (
          <AzuosActionButton
            data={{ label: 'Remover?' }}
            ui={{ variant: 'danger', size: 'sm', icon: Trash2 }}
            actions={{ onClick: () => actions.onRemove(widget.id) }}
          />
        ) : (
          <AzuosActionButton
            data={{ label: `Remover ${widget.title}` }}
            ui={{ variant: 'ghost', icon: Trash2, isIconOnly: true }}
            actions={{ onClick: () => setIsArmed(true) }}
          />
        )}
      </span>
    </>
  );
}

/** Trocar o gráfico sem abrir o editor: os mais usados primeiro, os outros embaixo (Hick). */
function KindSwitch({
  data,
  actions,
}: {
  data: { kind: Widget['kind']; title: string };
  actions: { onChange: (kind: Widget['kind']) => void };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = WIDGET_KIND_LOOK[data.kind];
  const CurrentIcon = current.icon;
  const pick = (kind: Widget['kind']) => {
    actions.onChange(kind);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Trocar o gráfico de ${data.title}`}
          className="flex control-lg items-center gap-1.5 rounded-control border border-border bg-muted text-xs font-semibold text-ink-900 hover:bg-mantle focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <CurrentIcon className="size-4 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">{current.short}</span>
          <ChevronDown className="size-3.5 text-ink-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 rounded-surface p-2">
        <KindGroup
          data={{ title: 'Mais usados', kinds: MAIN_KINDS, current: data.kind }}
          actions={{ onPick: pick }}
        />
        <KindGroup
          data={{ title: 'Outros', kinds: OTHER_KINDS, current: data.kind }}
          actions={{ onPick: pick }}
        />
      </PopoverContent>
    </Popover>
  );
}

function KindGroup({
  data,
  actions,
}: {
  data: { title: string; kinds: readonly Widget['kind'][]; current: Widget['kind'] };
  actions: { onPick: (kind: Widget['kind']) => void };
}) {
  return (
    <div role="radiogroup" aria-label={data.title} className="p-1">
      <p className="px-1 pb-1 text-xs font-semibold tracking-wider text-ink-500 uppercase">
        {data.title}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {data.kinds.map((kind) => {
          const look = WIDGET_KIND_LOOK[kind];
          const Icon = look.icon;
          const isChosen = kind === data.current;

          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={isChosen}
              aria-description={weightLabel(WIDGET_WEIGHTS[kind])}
              onClick={() => actions.onPick(kind)}
              className={cn(
                'flex control-lg items-center gap-2 rounded-control text-left text-xs font-semibold',
                isChosen ? 'bg-primary text-primary-foreground' : 'text-ink-900 hover:bg-muted',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{look.short}</span>
              {/* O peso de cada tipo ao trocar o gráfico; o leitor de tela o ouve na descrição. */}
              <span
                aria-hidden="true"
                className={cn(
                  'shrink-0 pr-1 font-medium',
                  isChosen ? 'text-primary-foreground' : 'text-ink-500',
                )}
              >
                {WIDGET_WEIGHTS[kind]} pt
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type BodyProps = {
  widget: Widget;
  result: WidgetState;
  series: { key: string; label: string; value: number }[];
  slices: { label: string; value: number }[];
  isLoading: boolean;
  noun: string;
};

/** Um desenho por tipo de bloco — trocar o gráfico é trocar a linha daqui. */
const BODIES: Record<Widget['kind'], (props: BodyProps) => ReactNode> = {
  stats: ({ widget, result, slices }) => (
    <StatsBody data={{ widget, total: result.data?.total ?? 0, slices }} />
  ),
  /* O destaque com o Zuzu: o total no título e, agrupando, até quatro cards LADO A LADO dentro
     dele — a grade do hero põe três por linha; aqui a linha é nossa, para caberem os quatro.
     Compacto para caber em DOIS andares: o nome do bloco vai embaixo do total (e não numa linha
     própria), os cards têm folga menor, e o que sobra de altura fica entre o topo e os cards
     (`justify-between`) — bloco mais alto não deixa faixa vazia no pé. */
  hero: ({ widget, result, slices, noun }) => {
    const total = (result.data?.total ?? 0).toLocaleString('pt-BR');
    const cards = widget.groupBy ? slices.slice(0, 4) : [];

    return (
      <AzuosDashboardHeroCard
        data={{
          title: `${total} ${noun}`,
          titleHighlight: total,
          description: widget.title,
          /* 112, e não 72: menor que isso o Zuzu virava um borrão ao lado do título. */
          zuzu: { pose: 'alert', size: 112 },
        }}
        ui={{
          className: 'h-full justify-between gap-4 overflow-y-auto p-5 sm:p-5',
          children: cards.length ? (
            <StatRow data={{ cards }} ui={{ cardClassName: 'p-3' }} />
          ) : null,
        }}
      />
    );
  },
  donut: ({ slices, isLoading, noun }) => (
    <AzuosDonutChart data={{ slices, seriesLabel: noun }} state={{ isLoading }} />
  ),
  list: ({ slices }) => <ListBody data={{ slices }} />,
  calendar: ({ series, isLoading, noun }) => (
    <AzuosCalendarChart
      data={{
        days: series.map((item) => ({ date: item.key, count: item.value })),
        seriesLabel: noun,
      }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  /* A agenda: a janela do bloco (até 90 dias) contada a partir de hoje, um mês ao lado do outro. */
  agenda: ({ widget, series, isLoading, noun }) => (
    <AzuosAgendaCalendar
      data={{
        days: series.map((item) => ({ date: item.key, count: item.value })),
        range: windowRange(widget.window ?? DEFAULT_WINDOW, todayIso()),
        seriesLabel: noun,
      }}
      state={{ isLoading }}
    />
  ),
  area: ({ series, isLoading, noun }) => (
    <AzuosAreaChart
      data={{
        points: series.map((item) => ({ at: monthStart(item.key), values: { total: item.value } })),
        series: [{ key: 'total', label: noun, color: themeColor('--chart-1') }],
      }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  column: (props) => <ColumnBody {...props} orientation="vertical" />,
  bar: (props) => <ColumnBody {...props} orientation="horizontal" />,
  radar: ({ slices, isLoading, noun }) => (
    <AzuosRadarChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  treemap: ({ slices, isLoading, noun }) => (
    <AzuosTreemapChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  /* O medidor: quantos o recorte (filtro, "só os meus", período) pega da fonte inteira. */
  radial: ({ widget, result, isLoading, noun }) => (
    <AzuosRadialChart
      data={{
        value: result.data?.total ?? 0,
        max: Math.max(1, result.data?.grandTotal ?? 0),
        label: widget.title,
        hint: `de ${result.data?.grandTotal ?? 0} ${noun}`,
      }}
      state={{ isLoading }}
    />
  ),
  stacked: ({ result, isLoading, noun }) => (
    <AzuosStackedBarChart
      data={{ ...toStacked(result.data?.cells ?? []), seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  heatmap: ({ result, isLoading, noun }) => (
    <AzuosHeatmapChart
      data={{ ...toHeatmap(result.data?.cells ?? []), seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  sankey: ({ result, isLoading, noun }) => (
    <AzuosSankeyChart
      data={{ ...toSankey(result.data?.cells ?? []), seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
    />
  ),
  pie: ({ slices, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'pie', slices }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  rose: ({ slices, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'rose', slices }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  halfDonut: ({ slices, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'halfDonut', slices }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  pareto: ({ slices, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'pareto', slices }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  cumulative: ({ series, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'cumulative', points: series }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  grouped: ({ result, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{
        chart: { kind: 'grouped', grouped: toStacked(result.data?.cells ?? []) },
        seriesLabel: noun,
      }}
      state={{ isLoading }}
    />
  ),
  /* O card com anel: o mesmo número do medidor — quantos o recorte pega da fonte inteira —, só
     que como card, com a fatia ao lado. */
  ringCard: ({ widget, result, isLoading, noun }) => (
    <RingCardBody
      data={{
        title: widget.title,
        count: result.data?.total ?? 0,
        total: result.data?.grandTotal ?? 0,
        noun,
      }}
      state={{ isLoading }}
    />
  ),
};

/**
 * O card de número com o ANEL ao lado: o número diz QUANTOS, o anel mostra a fatia do total que
 * isso representa, e o meio do anel repete a contagem ("14 de 136"). O card reserva a direita
 * (`pr-32`) para o texto nunca passar por baixo do anel.
 */
function RingCardBody({
  data,
  state,
}: {
  data: { title: string; count: number; total: number; noun: string };
  state: { isLoading: boolean };
}) {
  const hue = cardToneClasses(RING_TONE).color;
  const isEmpty = data.total <= 0;

  return (
    <div className="relative h-full">
      <AzuosStatCard
        data={{
          label: data.title,
          value: formatCount(data.count),
          hint: `de ${formatCount(data.total)} ${data.noun}`,
        }}
        ui={{ tone: RING_TONE, icon: Hash, className: 'h-full pr-32' }}
        state={{ isLoading: state.isLoading }}
      />
      <div className="absolute top-1/2 right-5 size-24 -translate-y-1/2">
        <AzuosEchart
          data={{
            option: (theme) =>
              countRingOption({ count: data.count, total: data.total, hue }, theme),
            description: `${data.title}: ${formatCount(data.count)} de ${formatCount(data.total)} ${data.noun}`,
          }}
          ui={{ heightClass: 'h-full' }}
          state={{ isLoading: state.isLoading }}
        />
        {state.isLoading ? null : (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl leading-none font-bold text-foreground tabular-nums">
              {isEmpty ? '—' : formatCount(data.count)}
            </span>
            {isEmpty ? null : (
              <span className="mt-0.5 text-xs leading-none text-muted-foreground tabular-nums">
                de {formatCount(data.total)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const RING_TONE: AzuosCardHue = 'blue';

/**
 * Duas fatias: a contagem no sotaque e o que falta na trilha do tema. A contagem nunca passa do
 * total (um dado fora do esperado não "estoura" o anel), e sem total o anel é só a trilha.
 */
export function countRingOption(
  data: { count: number; total: number; hue: string },
  theme: Pick<ChartTheme, 'track'>,
): ChartOption {
  const total = Math.max(data.total, 0);
  const done = Math.min(Math.max(data.count, 0), total);

  return {
    series: [
      {
        type: 'pie',
        radius: ['72%', '100%'],
        silent: true,
        label: { show: false },
        emphasis: { disabled: true },
        data: [
          { name: 'Contagem', value: done, itemStyle: { color: resolveColor(data.hue) } },
          {
            name: 'Restante',
            value: total > 0 ? total - done : 1,
            itemStyle: { color: theme.track },
          },
        ],
      },
    ],
  };
}

function ColumnBody({
  slices,
  isLoading,
  noun,
  orientation,
}: BodyProps & { orientation: 'vertical' | 'horizontal' }) {
  return (
    <AzuosColumnChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ orientation, heightClass: 'h-full min-h-40' }}
    />
  );
}

function WidgetBody({ data }: { data: AzuosBoardWidgetProps['data'] }) {
  const { widget, result } = data;
  if (result.error) {
    return (
      <p
        role="alert"
        className="flex h-full items-center justify-center rounded-box bg-muted p-4 text-center text-sm font-medium text-hue-red"
      >
        {result.error}
      </p>
    );
  }
  const series = result.data?.series ?? [];
  const Body = BODIES[widget.kind];

  return (
    <Body
      widget={widget}
      result={result}
      series={series}
      slices={series.map((item) => ({ label: item.label, value: item.value }))}
      isLoading={result.isLoading && !result.data}
      noun={DATA_SOURCES[widget.source].noun}
    />
  );
}

/** Sem agrupar, um card com o total; agrupando, um card por grupo, até quatro. */
function StatsBody({
  data,
}: {
  data: { widget: Widget; total: number; slices: { label: string; value: number }[] };
}) {
  const cards = data.widget.groupBy
    ? data.slices.slice(0, 4)
    : [{ label: data.widget.title, value: data.total }];

  return <StatRow data={{ cards }} ui={{ className: 'h-full' }} />;
}

/**
 * A linha de cards dos blocos de números e do destaque: até quatro lado a lado, cada um com um
 * tom e o ícone — o grupo se distingue pelo nome e pelo ícone, não só pela cor.
 */
function StatRow({
  data,
  ui,
}: {
  data: { cards: { label: string; value: number }[] };
  /** `cardClassName`: a folga de cada card — menor dentro do destaque, para caber em dois andares. */
  ui?: { className?: string; cardClassName?: string };
}) {
  /* A linha mede o espaço DELA (`@container`), e não a tela: no painel largo, quatro lado a
     lado; na pré-visualização do editor (26rem), dois por linha — antes os quatro espremidos
     cortavam o nome do grupo. */
  return (
    <div className={cn('@container', ui?.className)}>
      <div className="grid h-full grid-cols-2 gap-3 @3xl:grid-cols-4">
        {data.cards.map((card, index) => (
          <AzuosStatCard
            key={card.label}
            data={{ label: card.label, value: card.value.toLocaleString('pt-BR') }}
            ui={{
              tone: STAT_HUES[index % STAT_HUES.length],
              icon: Hash,
              className: cn('h-full p-4', ui?.cardClassName),
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** A lista ordenada: os grupos do maior para o menor, com a barra do tamanho de cada um. */
function ListBody({ data }: { data: { slices: { label: string; value: number }[] } }) {
  const max = Math.max(1, ...data.slices.map((slice) => slice.value));
  if (data.slices.length === 0) return <p className="text-sm text-ink-500">Nada para mostrar.</p>;

  return (
    <ol className="flex h-full flex-col gap-2 overflow-y-auto">
      {data.slices.map((slice, index) => (
        <li key={slice.label} className="flex items-center gap-3 text-sm">
          <span className="w-5 text-right text-xs text-ink-500">{index + 1}º</span>
          <span className="min-w-0 flex-1">
            <span className="flex justify-between gap-2">
              <span className="truncate text-ink-900">{slice.label}</span>
              <span className="font-semibold text-ink-900">{slice.value}</span>
            </span>
            <span className="mt-1 block h-1.5 rounded-full bg-muted">
              <span
                className="block h-1.5 rounded-full bg-primary"
                style={{ width: `${(slice.value / max) * 100}%` }}
              />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** "2026-11" vira o primeiro dia do mês; o dia já vem inteiro. */
function monthStart(key: string): string {
  return key.length === 7 ? `${key}-01T12:00:00.000Z` : `${key}T12:00:00.000Z`;
}
