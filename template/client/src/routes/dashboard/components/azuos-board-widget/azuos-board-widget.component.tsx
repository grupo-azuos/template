import { ChevronDown, GripVertical, Hash, Settings2, Trash2 } from 'lucide-react';
import { type CSSProperties, type ReactNode, useState } from 'react';

import { todayIso } from '@template/shared/domain/calendar-date.util';
import {
  DATA_SOURCES,
  DEFAULT_WINDOW,
  type Widget,
  WIDGET_PERIOD_LABELS,
  WIDGET_WEIGHTS,
  weightLabel,
  widgetIsClickable,
  widgetWeight,
  windowLabel,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosAreaChart } from '../../../../lib/components/azuos-area-chart/azuos-area-chart.component';
import { AzuosColumnChart } from '../../../../lib/components/azuos-column-chart/azuos-column-chart.component';
import { AzuosCalendarChart } from '../../../../lib/components/azuos-calendar-chart/azuos-calendar-chart.component';
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
import {
  type ChartOption,
  type ChartTheme,
  formatCount,
  resolveColor,
} from '../../../../lib/utils/echarts.util';
import { cn } from '../../../../lib/utils/cn.util';
import { type BoardItem, drillScreenOf } from '../../../../lib/utils/board-link.util';
import { themeColor } from '../../../../lib/utils/theme-color.util';
import { type WidgetState } from '../../../../lib/view-models/use-dashboard-board.model';
import { AzuosAgendaCalendar } from '../azuos-agenda-calendar/azuos-agenda-calendar.component';
import { AzuosBoardPanelMenu } from '../azuos-board-panel-menu/azuos-board-panel-menu.component';
import { AzuosDashboardHeroCard } from '../azuos-dashboard-hero-card/azuos-dashboard-hero-card.component';
import { AzuosWidgetChart } from '../azuos-widget-chart/azuos-widget-chart.component';
import { MAIN_KINDS, OTHER_KINDS, WIDGET_KIND_LOOK } from './widget-kind.util';
import { cellItemOf, itemOfLabel, sankeyItemOf, timeItemOf } from './widget-items.util';
import { toHeatmap, toSankey, toStacked } from './widget-pairs.util';

/**
 * UM BLOCO DO DASHBOARD — a fonte contada, desenhada no formato escolhido. O mesmo bloco serve
 * a ver e a montar: vendo, o título tem o menu do bloco (Ver, e — para quem monta — Editar,
 * Duplicar e Remover); montando, a barra de ferramentas flutua ACIMA do bloco, com a alça de
 * arrastar, o peso, o "trocar o gráfico", o "configurar" e o "remover".
 */
export type AzuosBoardWidgetProps = {
  data: {
    widget: Widget;
    result: WidgetState;
    filterName: string | null;
  };
  /**
   * `isPreview`: o bloco desenhado dentro do editor. Ali não expande — uma tela cheia aberta de
   * dentro do diálogo brigava com ele e com a tela de montar o painel.
   */
  /** `canEdit`: quem vê pode montar — o menu do bloco oferece editar, duplicar e remover. */
  state: { isEditing: boolean; isPreview?: boolean; canEdit?: boolean };
  actions: {
    onEdit: (id: string) => void;
    onRemove: (id: string) => void;
    /** Trocar o gráfico direto no bloco, sem abrir o editor (só montando o painel). */
    onChangeKind?: (id: string, kind: Widget['kind']) => void;
    /** O "Duplicar" do menu do bloco: uma cópia no fim do painel. */
    onDuplicate?: (id: string) => void;
    /**
     * Clicou num item (barra, fatia, linha, card, dia): abre a tela da fonte com o recorte do
     * bloco e o valor clicado. Sem ela — montando o painel, ou com os itens não clicáveis — o
     * bloco fica de leitura.
     */
    onOpenItem?: (widget: Widget, item: BoardItem) => void;
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
    return <CardWidget data={data} state={state} actions={actions} />;
  }

  const look = WIDGET_KIND_LOOK[widget.kind];
  const Icon = look.icon;

  /* O cartão: a faixa do cabeçalho (ícone, título, o que conta, o recorte em selos) e o menu
     do bloco dentro dela — nada solto embaixo (conectividade uniforme). Montando, quem desenha a
     seleção é o canvas (o contorno tracejado e os puxadores). */
  return (
    <section
      aria-label={widget.title}
      className="rounded-surface bg-card shadow-card relative flex h-full min-h-0 flex-col"
    >
      {state.isEditing ? <EditBar data={data} actions={actions} /> : null}
      <header
        className={cn(
          'border-border flex items-start gap-3 border-b px-4 pt-3.5 pb-3',
          state.isEditing && cn(DRAG_HANDLE, 'cursor-grab active:cursor-grabbing'),
        )}
      >
        <span className="rounded-box bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <h3 className="text-ink-900 truncate text-sm font-bold tracking-tight">{widget.title}</h3>
          <span className="text-ink-500 block truncate text-xs">{measureOf(data)}</span>
          <ScopeChips data={data} />
        </span>
        <span className={cn('flex shrink-0 items-center gap-1', NO_DRAG)}>
          {!state.isEditing && !state.isPreview ? (
            /* O menu do título, como no Grafana: Ver, e — para quem monta — Editar, Duplicar e
               Remover. */
            <AzuosBoardPanelMenu
              data={{ title: widget.title }}
              state={{ canEdit: state.canEdit }}
              actions={{
                onView: () => setIsExpanded(true),
                onEdit: () => actions.onEdit(widget.id),
                onDuplicate: actions.onDuplicate
                  ? () => actions.onDuplicate?.(widget.id)
                  : undefined,
                onRemove: () => actions.onRemove(widget.id),
              }}
            />
          ) : null}
        </span>
      </header>
      <div className="min-h-0 flex-1 p-4">
        <WidgetBody data={data} actions={actions} />
      </div>
      <AzuosExpandableScreen
        data={{ title: widget.title, description: measureOf(data) }}
        state={{ isOpen: isExpanded }}
        actions={{ onClose: () => setIsExpanded(false) }}
      >
        <div className="h-[70vh] p-6">
          <WidgetBody data={data} actions={actions} />
        </div>
      </AzuosExpandableScreen>
    </section>
  );
}

/** Os cards e o destaque: já são superfícies, sem a moldura dos gráficos. */
function CardWidget({ data, state, actions }: AzuosBoardWidgetProps) {
  return (
    <div className="relative h-full">
      <WidgetBody data={data} actions={actions} />
      {state.isEditing ? <EditBar data={data} actions={actions} /> : null}
    </div>
  );
}

/**
 * A BARRA DO BLOCO, montando, com o mesmo canto da alça de arrastar de dentro (em pílula, a alça
 * quadrada ficava torta na ponta): flutua ACIMA do bloco, no vão entre os andares, como a
 * etiqueta de um quadro num editor de design. O bloco embaixo fica igual ao do painel — nada por
 * cima do título, do número ou do gráfico.
 */
function EditBar({ data, actions }: Pick<AzuosBoardWidgetProps, 'data' | 'actions'>) {
  return (
    <div className="rounded-box bg-card shadow-card ring-foreground/8 absolute bottom-full left-0 z-10 mb-4 flex max-w-full items-center gap-1 p-1 ring-1">
      <DragHandle data={{ title: data.widget.title }} />
      <EditTools data={data} actions={actions} />
    </div>
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
        'rounded-box bg-primary-soft text-primary flex size-10 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
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
function EditTools({ data, actions }: Pick<AzuosBoardWidgetProps, 'data' | 'actions'>) {
  const [isArmed, setIsArmed] = useState(false);
  const { widget } = data;

  return (
    <>
      {/* O peso do bloco na cota do painel, à vista de quem monta — é o que se gasta com ele. */}
      <span
        aria-label={`Peso: ${weightLabel(widgetWeight(widget))}`}
        className="rounded-chip bg-muted text-ink-700 shrink-0 px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
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
      <span className="border-border ml-2 border-l pl-2">
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
          className="control-lg rounded-control bg-muted text-ink-900 hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-1.5 text-xs font-semibold focus-visible:ring-[3px] focus-visible:outline-none"
        >
          <CurrentIcon className="text-primary size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{current.short}</span>
          <ChevronDown className="text-ink-500 size-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="rounded-box bg-popover ring-foreground/8 w-64 border-transparent p-2 shadow-xl ring-1"
      >
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
      <p className="text-ink-500 px-1 pb-1 text-xs font-medium">{data.title}</p>
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
                'control-lg rounded-control flex items-center gap-2 text-left text-xs font-semibold',
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
  /** O item clicado: só existe quando o bloco abre a tela da fonte. */
  onItem?: (item: BoardItem) => void;
};

/** Um desenho por tipo de bloco — trocar o gráfico é trocar a linha daqui. */
const BODIES: Record<Widget['kind'], (props: BodyProps) => ReactNode> = {
  stats: ({ widget, result, series, slices, onItem }) => (
    <StatsBody
      data={{ widget, total: result.data?.total ?? 0, slices }}
      actions={{
        onItem: onItem ? (label) => onItem(statItemOf(widget, series, label)) : undefined,
      }}
    />
  ),
  /* O destaque com o Zuzu: o total no título e, agrupando, até quatro cards LADO A LADO dentro
     dele — a grade do hero põe três por linha; aqui a linha é nossa, para caberem os quatro.
     Compacto para caber em DOIS andares: o nome do bloco vai embaixo do total (e não numa linha
     própria), os cards têm folga menor, e o que sobra de altura fica entre o topo e os cards
     (`justify-between`) — bloco mais alto não deixa faixa vazia no pé. Sem rolagem própria: se o
     conteúdo passa dos andares (cards em duas fileiras, uma nota a mais), quem cresce é a casa
     da grade (`CONTENT_FIT_KINDS` do canvas) — a barra de rolagem por dentro cortava os cards. */
  hero: ({ widget, result, series, slices, noun, onItem }) => {
    const total = (result.data?.total ?? 0).toLocaleString('pt-BR');
    const cards = widget.groupBy ? slices.slice(0, 4) : [];
    const onCard = onItem ? (label: string) => onItem(itemOfLabel(series, label)) : undefined;

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
          className: 'h-full justify-between gap-4 p-5 sm:p-5',
          children: cards.length ? (
            <StatRow data={{ cards }} ui={{ cardClassName: 'p-3' }} actions={{ onCard }} />
          ) : null,
        }}
      />
    );
  },
  donut: ({ series, slices, isLoading, noun, onItem }) => (
    <AzuosDonutChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      actions={{ onSelect: selectByLabel(series, onItem) }}
    />
  ),
  list: ({ series, slices, onItem }) => (
    <ListBody data={{ slices }} actions={{ onSelect: selectByLabel(series, onItem) }} />
  ),
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
  area: ({ series, isLoading, noun, onItem }) => (
    <AzuosAreaChart
      data={{
        points: series.map((item) => ({ at: monthStart(item.key), values: { total: item.value } })),
        series: [{ key: 'total', label: noun, color: themeColor('--chart-1') }],
      }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
      actions={{
        onSelect: onItem
          ? (at) => {
              const item = timeItemOf(series, at);
              if (item) onItem(item);
            }
          : undefined,
      }}
    />
  ),
  column: (props) => <ColumnBody {...props} orientation="vertical" />,
  bar: (props) => <ColumnBody {...props} orientation="horizontal" />,
  radar: ({ series, slices, isLoading, noun, onItem }) => (
    <AzuosRadarChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
      actions={{ onSelect: selectByLabel(series, onItem) }}
    />
  ),
  treemap: ({ series, slices, isLoading, noun, onItem }) => (
    <AzuosTreemapChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ heightClass: 'h-full min-h-40' }}
      actions={{ onSelect: selectByLabel(series, onItem) }}
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
  stacked: ({ result, isLoading, noun, onItem }) => {
    const cells = result.data?.cells ?? [];

    return (
      <AzuosStackedBarChart
        data={{ ...toStacked(cells), seriesLabel: noun }}
        state={{ isLoading }}
        ui={{ heightClass: 'h-full min-h-40' }}
        actions={{
          onSelect: onItem ? (row, column) => onItem(cellItemOf(cells, row, column)) : undefined,
        }}
      />
    );
  },
  heatmap: ({ result, isLoading, noun, onItem }) => {
    const cells = result.data?.cells ?? [];

    return (
      <AzuosHeatmapChart
        data={{ ...toHeatmap(cells), seriesLabel: noun }}
        state={{ isLoading }}
        ui={{ heightClass: 'h-full min-h-40' }}
        actions={{
          onSelect: onItem ? (cell) => onItem(cellItemOf(cells, cell.row, cell.column)) : undefined,
        }}
      />
    );
  },
  sankey: ({ result, isLoading, noun, onItem }) => {
    const cells = result.data?.cells ?? [];
    const select = (nodeId: string) => {
      const item = sankeyItemOf(cells, nodeId);
      if (item) onItem?.(item);
    };

    return (
      <AzuosSankeyChart
        data={{ ...toSankey(cells), seriesLabel: noun }}
        state={{ isLoading }}
        ui={{ heightClass: 'h-full min-h-40' }}
        actions={{ onSelect: onItem ? select : undefined }}
      />
    );
  },
  pie: (props) => <SliceChart {...props} shape="pie" />,
  rose: (props) => <SliceChart {...props} shape="rose" />,
  halfDonut: (props) => <SliceChart {...props} shape="halfDonut" />,
  pareto: (props) => <SliceChart {...props} shape="pareto" />,
  cumulative: ({ series, isLoading, noun }) => (
    <AzuosWidgetChart
      data={{ chart: { kind: 'cumulative', points: series }, seriesLabel: noun }}
      state={{ isLoading }}
    />
  ),
  grouped: ({ result, isLoading, noun, onItem }) => {
    const cells = result.data?.cells ?? [];

    return (
      <AzuosWidgetChart
        data={{ chart: { kind: 'grouped', grouped: toStacked(cells) }, seriesLabel: noun }}
        state={{ isLoading }}
        actions={{
          onSelect: onItem
            ? (selection) => onItem(cellItemOf(cells, selection.name, selection.series))
            : undefined,
        }}
      />
    );
  },
  /* O card com anel (o do Fechamentos do contábil): o mesmo número do medidor — quantos o
     recorte pega da fonte inteira —, só que como card, com a fatia ao lado. */
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
            <span className="text-foreground text-xl leading-none font-bold tabular-nums">
              {isEmpty ? '—' : formatCount(data.count)}
            </span>
            {isEmpty ? null : (
              <span className="text-muted-foreground mt-0.5 text-xs leading-none tabular-nums">
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
  series,
  slices,
  isLoading,
  noun,
  orientation,
  onItem,
}: BodyProps & { orientation: 'vertical' | 'horizontal' }) {
  return (
    <AzuosColumnChart
      data={{ slices, seriesLabel: noun }}
      state={{ isLoading }}
      ui={{ orientation, heightClass: 'h-full min-h-40' }}
      actions={{ onSelect: selectByLabel(series, onItem) }}
    />
  );
}

/** Pizza, rosa, meia-rosca e Pareto: um gráfico de fatias, e a fatia clicada é o item. */
function SliceChart({
  series,
  slices,
  isLoading,
  noun,
  onItem,
  shape,
}: BodyProps & { shape: 'pie' | 'rose' | 'halfDonut' | 'pareto' }) {
  const select = selectByLabel(series, onItem);

  return (
    <AzuosWidgetChart
      data={{ chart: { kind: shape, slices }, seriesLabel: noun }}
      state={{ isLoading }}
      actions={{ onSelect: select ? (selection) => select(selection.name) : undefined }}
    />
  );
}

/** O clique num rótulo de grupo vira o item daquele grupo; sem clique, nada. */
function selectByLabel(
  series: BodyProps['series'],
  onItem: BodyProps['onItem'],
): ((label: string) => void) | undefined {
  if (!onItem) return undefined;

  return (label) => onItem(itemOfLabel(series, label));
}

/** O card de número: agrupando, o grupo do card; sem agrupar, o bloco inteiro. */
function statItemOf(widget: Widget, series: BodyProps['series'], label: string): BoardItem {
  return widget.groupBy ? itemOfLabel(series, label) : { key: null };
}

function WidgetBody({ data, actions }: Pick<AzuosBoardWidgetProps, 'data' | 'actions'>) {
  const { widget, result } = data;
  if (result.error) {
    return (
      <p
        role="alert"
        className="rounded-box bg-destructive-soft text-foreground flex h-full items-center justify-center p-4 text-center text-sm font-medium"
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
      onItem={itemClickOf(widget, actions.onOpenItem)}
    />
  );
}

/**
 * O clique num item, quando o bloco o promete: os itens escolhidos como clicáveis (o padrão), uma
 * lista da fonte para abrir e alguém para abri-la. Montando o painel, ou com os itens não clicáveis, o bloco fica de
 * leitura — sem mãozinha.
 */
function itemClickOf(
  widget: Widget,
  onOpenItem: AzuosBoardWidgetProps['actions']['onOpenItem'],
): ((item: BoardItem) => void) | undefined {
  if (!onOpenItem || !widgetIsClickable(widget) || !drillScreenOf(widget.source)) return undefined;

  return (item) => onOpenItem(widget, item);
}

/**
 * Sem agrupar, um card com o total; agrupando, um card por grupo, até quatro.
 *
 * Agrupando e sem nenhum grupo, não sobra card — e o bloco ficava em BRANCO, sem moldura nem
 * texto, como se tivesse quebrado. Agora ele diz que não há dados no recorte.
 */
function StatsBody({
  data,
  actions,
}: {
  data: { widget: Widget; total: number; slices: { label: string; value: number }[] };
  actions: { onItem?: (label: string) => void };
}) {
  const cards = data.widget.groupBy
    ? data.slices.slice(0, 4)
    : [{ label: data.widget.title, value: data.total }];
  if (cards.length === 0) return <StatsEmpty data={{ title: data.widget.title }} />;

  return (
    <StatRow data={{ cards }} ui={{ className: 'h-full' }} actions={{ onCard: actions.onItem }} />
  );
}

/** O aviso no lugar dos cards vazios: na superfície do card, para o bloco não sumir da grade. */
function StatsEmpty({ data }: { data: { title: string } }) {
  return (
    <div
      role="status"
      className="rounded-surface bg-card shadow-card flex h-full flex-col items-center justify-center gap-1 p-4 text-center"
    >
      <span className="text-ink-900 text-sm font-semibold">{data.title}</span>
      <span className="text-ink-500 text-sm">Sem dados para mostrar neste recorte.</span>
    </div>
  );
}

/**
 * A linha de cards dos blocos de números e do destaque: até quatro lado a lado, cada um com um
 * tom e o ícone — o grupo se distingue pelo nome e pelo ícone, não só pela cor.
 */
function StatRow({
  data,
  ui,
  actions,
}: {
  data: { cards: { label: string; value: number }[] };
  /** `cardClassName`: a folga de cada card — menor dentro do destaque, para caber em dois andares. */
  ui?: { className?: string; cardClassName?: string };
  /** `onCard`: o card vira atalho para a lista do que ele conta. */
  actions?: { onCard?: (label: string) => void };
}) {
  const onCard = actions?.onCard;

  /* A linha mede o espaço DELA (`@container`), e não a tela: no painel largo, todos lado a lado;
     na pré-visualização do editor, dois por linha. As colunas são as dos cards que há (até
     quatro): com quatro colunas fixas, dois cards num bloco largo deixavam um buraco. */
  const columns = {
    '--stat-columns': Math.max(1, Math.min(data.cards.length, 4)),
    '--stat-columns-narrow': Math.max(1, Math.min(data.cards.length, 2)),
  } as CSSProperties;

  return (
    <div className={cn('@container', ui?.className)} style={columns}>
      <div className="grid h-full grid-cols-[repeat(var(--stat-columns-narrow),minmax(0,1fr))] gap-3 @3xl:grid-cols-[repeat(var(--stat-columns),minmax(0,1fr))]">
        {data.cards.map((card, index) => (
          <AzuosStatCard
            key={card.label}
            data={{ label: card.label, value: card.value.toLocaleString('pt-BR') }}
            ui={{
              tone: STAT_HUES[index % STAT_HUES.length],
              icon: Hash,
              className: cn('h-full p-4', ui?.cardClassName),
            }}
            actions={{ onClick: onCard ? () => onCard(card.label) : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A lista ordenada: os grupos do maior para o menor, com a barra do tamanho de cada um. Com
 * `onSelect`, cada linha é um botão que abre a lista do grupo.
 */
function ListBody({
  data,
  actions,
}: {
  data: { slices: { label: string; value: number }[] };
  actions?: { onSelect?: (label: string) => void };
}) {
  const max = Math.max(1, ...data.slices.map((slice) => slice.value));
  if (data.slices.length === 0) return <p className="text-ink-500 text-sm">Nada para mostrar.</p>;
  const onSelect = actions?.onSelect;

  return (
    <ol className="flex h-full flex-col gap-2 overflow-y-auto">
      {data.slices.map((slice, index) => (
        <li key={slice.label} className="text-sm">
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(slice.label)}
              className="rounded-control hover:bg-muted focus-visible:ring-ring/50 flex w-full items-center gap-3 text-left focus-visible:ring-[3px] focus-visible:outline-none"
            >
              <ListRow data={{ slice, index, max }} />
            </button>
          ) : (
            <span className="flex items-center gap-3">
              <ListRow data={{ slice, index, max }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function ListRow({
  data,
}: {
  data: { slice: { label: string; value: number }; index: number; max: number };
}) {
  const { slice } = data;

  return (
    <>
      <span className="text-ink-500 w-5 text-right text-xs">{data.index + 1}º</span>
      <span className="min-w-0 flex-1">
        <span className="flex justify-between gap-2">
          <span className="text-ink-900 truncate">{slice.label}</span>
          <span className="text-ink-900 font-semibold">{slice.value}</span>
        </span>
        <span className="bg-muted mt-1 block h-1.5 rounded-full">
          <span
            className="bg-primary block h-1.5 rounded-full"
            style={{ width: `${(slice.value / data.max) * 100}%` }}
          />
        </span>
      </span>
    </>
  );
}

/** "2026-11" vira o primeiro dia do mês; o dia já vem inteiro. */
function monthStart(key: string): string {
  return key.length === 7 ? `${key}-01T12:00:00.000Z` : `${key}T12:00:00.000Z`;
}
