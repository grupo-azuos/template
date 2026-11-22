import { Check, ListFilter } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { todayIso } from '@template/shared/domain/calendar-date.util';
import {
  DATA_SOURCE_KEYS,
  DATA_SOURCES,
  type DataSourceKey,
  DEFAULT_WINDOW,
  hasPersonField,
  MAX_WINDOW_DAYS,
  type SavedFilter,
  type Widget,
  WIDGET_KIND_LABELS,
  WIDGET_PERIOD_LABELS,
  WIDGET_PERIODS,
  WIDGET_WEIGHTS,
  type WidgetPeriod,
  weightLabel,
  widgetSchema,
  type WidgetWindow,
  WINDOW_COUNTS,
  WINDOW_UNIT_LABELS,
  type WindowUnit,
  windowLabel,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosCheckboxField } from '../../../../lib/components/azuos-checkbox-field/azuos-checkbox-field.component';
import { AzuosDateRangeField } from '../../../../lib/components/azuos-date-range-field/azuos-date-range-field.component';
import { AzuosExpandableScreen } from '../../../../lib/components/azuos-expandable-screen/azuos-expandable-screen.component';
import { AzuosFilterField } from '../../../../lib/components/azuos-filter-field/azuos-filter-field.component';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { AzuosSubmitButton } from '../../../../lib/components/azuos-submit-button/azuos-submit-button.component';
import { AzuosTextField } from '../../../../lib/components/azuos-text-field/azuos-text-field.component';
import { cn } from '../../../../lib/utils/cn.util';
import { type WidgetState } from '../../../../lib/view-models/use-dashboard-board.model';
import { AzuosBoardWidget } from '../azuos-board-widget/azuos-board-widget.component';
import { MAIN_KINDS, OTHER_KINDS, WIDGET_KIND_LOOK } from '../azuos-board-widget/widget-kind.util';
import {
  autoTitle,
  filterOptions,
  fitGroup,
  followTitle,
  groupOptions,
  isPair,
  NO_FILTER,
  NO_GROUP,
  sourceHasDays,
  splitOptions,
  usesGroup,
} from './widget-editor.util';

/**
 * O BLOCO ABERTO PARA EDITAR — no formato do editor de painel do Grafana, numa tela cheia: em
 * cima a PRÉ-VISUALIZAÇÃO EM TEMPO REAL, com os números de verdade do bloco como ele está agora;
 * embaixo a consulta (fonte, agrupar, dividir, período, filtro); na lateral o tipo de gráfico e o
 * título. Trocar o gráfico ou a fonte acerta o resto sozinho (`fitGroup`), para o formulário nunca
 * ficar numa combinação que o servidor recusa.
 *
 * `useState` aqui é estado de formulário; quem guarda no rascunho do painel é o view-model.
 */
export type AzuosWidgetEditorDialogProps = {
  data: {
    editing: { widget: Widget; isNew: boolean } | null;
    filters: SavedFilter[];
    /** Os números do bloco como está no editor; sem ela, a pré-visualização espera. */
    preview?: WidgetState | null;
  };
  /** `isHidden`: o montador de filtros está aberto por cima — o editor sai da frente sem perder o que foi preenchido. */
  state?: { isHidden?: boolean };
  actions: {
    onClose: () => void;
    onSubmit: (widget: Widget) => void;
    /** Abre o montador de filtros, para criar um que ainda não existe. */
    onOpenFilters: () => void;
    /** Cada mudança do formulário, para a pré-visualização buscar os números. */
    onPreviewChange?: (widget: Widget) => void;
  };
};

export function AzuosWidgetEditorDialog({ data, state, actions }: AzuosWidgetEditorDialogProps) {
  const isOpen = data.editing !== null && !state?.isHidden;
  const form = useWidgetDraft(data.editing, actions.onSubmit, actions.onPreviewChange);

  return (
    <AzuosExpandableScreen
      data={{
        title: data.editing?.isNew === false ? 'Editar bloco' : 'Novo bloco',
        description:
          'O bloco em cima, a consulta embaixo e o tipo de gráfico ao lado — o resultado muda na hora.',
      }}
      state={{ isOpen }}
      actions={{ onClose: actions.onClose }}
    >
      {form.widget ? (
        <EditorBody
          data={{
            widget: form.widget,
            filters: data.filters,
            preview: data.preview ?? null,
            error: form.error,
            isNew: data.editing?.isNew !== false,
          }}
          actions={{
            onChange: form.onChange,
            onSubmit: form.onSubmit,
            onClose: actions.onClose,
            onOpenFilters: actions.onOpenFilters,
          }}
        />
      ) : null}
    </AzuosExpandableScreen>
  );
}

/**
 * O EDITOR DO BLOCO no formato do Grafana: o bloco GRANDE em cima, com os números de agora;
 * embaixo, a CONSULTA (de onde vêm os números e o recorte); na lateral, as OPÇÕES do gráfico (o
 * tipo, o título, o calendário). Tudo que muda aparece na hora em cima.
 */
function EditorBody({
  data,
  actions,
}: {
  data: {
    widget: Widget;
    filters: SavedFilter[];
    preview: WidgetState | null;
    error: string | null;
    isNew: boolean;
  };
  actions: WidgetFormProps['actions'] & { onSubmit: () => void; onClose: () => void };
}) {
  const form = { widget: data.widget, filters: data.filters };
  const fieldActions = { onChange: actions.onChange, onOpenFilters: actions.onOpenFilters };

  return (
    <form
      className="flex h-full min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        actions.onSubmit();
      }}
    >
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-h-0 flex-col lg:overflow-y-auto">
          <Preview data={{ widget: data.widget, preview: data.preview, filters: data.filters }} />
          {/* A CONSULTA: de onde vêm os números, como se agrupam e quais entram na conta. */}
          <section aria-label="Consulta" className="border-border flex flex-col gap-5 border-t p-5">
            <QueryFields data={form} actions={fieldActions} />
          </section>
        </div>
        {/* AS OPÇÕES do gráfico, na lateral, como no Grafana: o tipo primeiro, depois o resto. */}
        <aside
          aria-label="Opções do gráfico"
          className="border-border bg-mantle flex flex-col gap-5 border-t p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l"
        >
          <ChartOptions data={form} actions={fieldActions} />
        </aside>
      </div>
      <footer className="border-border bg-card flex items-center justify-end gap-2 border-t px-6 py-3">
        {data.error ? (
          <p role="alert" className="text-destructive mr-auto text-sm">
            {data.error}
          </p>
        ) : null}
        <AzuosActionButton
          data={{ label: 'Descartar' }}
          ui={{ variant: 'ghost' }}
          actions={{ onClick: actions.onClose }}
        />
        <AzuosSubmitButton data={{ label: data.isNew ? 'Adicionar bloco' : 'Aplicar' }} />
      </footer>
    </form>
  );
}

/**
 * O RASCUNHO DO BLOCO — mora no diálogo, fora do conteúdo (que desmonta ao fechar): esconder o
 * diálogo para montar um filtro não perde o preenchido. Só recomeça quando OUTRO bloco abre.
 */
function useWidgetDraft(
  editing: AzuosWidgetEditorDialogProps['data']['editing'],
  onValid: (widget: Widget) => void,
  onPreview?: (widget: Widget) => void,
) {
  const initial = editing ? startOf(editing) : null;
  const [widget, setWidget] = useState<Widget | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(initial);
  if (seen?.id !== initial?.id) {
    setSeen(initial);
    setWidget(initial);
    setError(null);
  }

  return {
    widget,
    error,
    onChange: (next: Partial<Widget>) => {
      if (!widget) return;
      const updated = followTitle(widget, fitGroup({ ...widget, ...next }));
      setWidget(updated);
      onPreview?.(updated);
    },
    onSubmit: () => {
      if (!widget) return;
      // Título apagado não trava: o bloco leva o nome que ele mesmo sugere.
      const parsed = widgetSchema.safeParse({
        ...widget,
        title: widget.title.trim() || autoTitle(widget),
      });
      if (parsed.success) {
        onValid(parsed.data);
        return;
      }
      setError(parsed.error.issues[0]?.message ?? 'Confira o bloco');
    },
  };
}

/**
 * Por onde o formulário começa: o bloco novo já vem acertado para o tipo escolhido e com o título
 * sugerido — quem monta só confirma ou ajusta (Lei de Tesler). O que já existe abre como está.
 */
function startOf(editing: NonNullable<AzuosWidgetEditorDialogProps['data']['editing']>): Widget {
  if (!editing.isNew) return editing.widget;
  const fitted = fitGroup(editing.widget);

  return fitted.title ? fitted : { ...fitted, title: autoTitle(fitted) };
}

type WidgetFormProps = {
  data: { widget: Widget; filters: SavedFilter[] };
  actions: {
    onChange: (next: Partial<Widget>) => void;
    onOpenFilters: () => void;
  };
};

/**
 * A CONSULTA, em grupos com a mesma grade: cada campo ocupa a coluna inteira dele (nada de caixas
 * de largura solta), e o que é uma linha só — a janela da agenda, "só os meus" — atravessa a
 * grade toda.
 */
function QueryFields({ data, actions }: WidgetFormProps) {
  return (
    <>
      <FormGroup data={{ legend: 'Os dados', hint: 'De onde vêm e como se agrupam.' }}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SourceFields data={data} actions={actions} />
        </div>
      </FormGroup>
      <FormGroup data={{ legend: 'O recorte', hint: 'Quais entram na conta.' }}>
        <div className="grid gap-4 sm:grid-cols-3">
          <ScopeFields data={data} actions={actions} />
        </div>
      </FormGroup>
    </>
  );
}

/** As OPÇÕES do gráfico: o título e o tipo. */
function ChartOptions({ data, actions }: WidgetFormProps) {
  const { widget } = data;
  const change = actions.onChange;

  return (
    <>
      <FormGroup data={{ legend: 'O gráfico', hint: 'Como os números aparecem.' }}>
        <AzuosTextField
          data={{
            label: 'Título',
            name: 'widgetTitle',
            value: widget.title,
            placeholder: autoTitle(widget),
          }}
          actions={{ onChange: (title) => change({ title }) }}
        />
        <KindGrid
          data={{ value: widget.kind }}
          actions={{ onChange: (kind) => change({ kind }) }}
        />
      </FormGroup>
    </>
  );
}

/** O campo preenche a coluna dele da grade, em vez de uma caixa de largura solta. */
const FULL = 'w-full';

/**
 * Um grupo do formulário, com nome: onze campos soltos cansam; três grupos de três a quatro se
 * leem de relance (Lei de Miller).
 */
function FormGroup({
  data,
  children,
}: {
  data: { legend: string; hint: string };
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-surface bg-card shadow-card flex flex-col gap-4 p-4">
      <legend className="text-ink-900 float-left mb-1 w-full text-sm font-bold">
        {data.legend}
        <span className="text-ink-500 ml-2 text-xs font-normal">{data.hint}</span>
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * A grade de tipos de gráfico: os seis mais usados à frente, os outros num segundo grupo (Lei de
 * Hick). O escolhido fica em cor cheia E com o visto — o estado não depende só da cor.
 */
function KindGrid({
  data,
  actions,
}: {
  data: { value: Widget['kind'] };
  actions: { onChange: (kind: Widget['kind']) => void };
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de gráfico" className="flex flex-col gap-3">
      <KindRow
        data={{ title: 'Mais usados', kinds: MAIN_KINDS, value: data.value }}
        actions={actions}
      />
      <KindRow
        data={{ title: 'Mais tipos', kinds: OTHER_KINDS, value: data.value }}
        actions={actions}
      />
    </div>
  );
}

function KindRow({
  data,
  actions,
}: {
  data: { title: string; kinds: readonly Widget['kind'][]; value: Widget['kind'] };
  actions: { onChange: (kind: Widget['kind']) => void };
}) {
  return (
    <div>
      <p className="text-ink-500 mb-1.5 text-xs font-semibold">{data.title}</p>
      <div className="grid grid-cols-3 gap-2">
        {data.kinds.map((kind) => {
          const look = WIDGET_KIND_LOOK[kind];
          const isChosen = kind === data.value;
          // O escolhido troca o ícone pelo visto: o estado não depende só da cor.
          const Icon = isChosen ? Check : look.icon;

          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={isChosen}
              aria-description={`${WIDGET_KIND_LABELS[kind]} · ${weightLabel(WIDGET_WEIGHTS[kind])}`}
              onClick={() => actions.onChange(kind)}
              className={cn(
                'rounded-box flex min-h-16 flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition-colors',
                'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
                isChosen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-ink-700 hover:bg-mantle',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {look.short}
              {/* O peso à vista na hora de escolher: trocar o gráfico muda a conta do painel. Fora
                  do nome acessível (o leitor de tela o ouve na descrição). */}
              <span
                aria-hidden="true"
                className={cn('font-medium', isChosen ? 'text-primary-foreground' : 'text-ink-500')}
              >
                {weightLabel(WIDGET_WEIGHTS[kind])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** De onde vêm os números: a fonte, o agrupamento e, nos de par, o "dividir por". */
function SourceFields({ data, actions }: WidgetFormProps) {
  const { widget } = data;
  const change = actions.onChange;

  return (
    <>
      <AzuosFilterField data={{ label: 'Fonte dos dados' }}>
        <AzuosSelectField
          data={{
            value: widget.source,
            /* A agenda só oferece fonte com data por dia — escolher outra não teria o que mostrar. */
            options:
              widget.kind === 'agenda'
                ? SOURCE_OPTIONS.filter((option) => sourceHasDays(option.value))
                : SOURCE_OPTIONS,
          }}
          ui={{ ariaLabel: 'Fonte dos dados', className: FULL }}
          actions={{
            onChange: (source) =>
              change({ source: source as DataSourceKey, groupBy: null, filterId: null }),
          }}
        />
      </AzuosFilterField>
      {usesGroup(widget.kind) ? (
        <AzuosFilterField data={{ label: 'Agrupar por' }}>
          <AzuosSelectField
            data={{ value: widget.groupBy ?? NO_GROUP, options: groupOptions(widget) }}
            ui={{ ariaLabel: 'Agrupar por', className: FULL }}
            actions={{ onChange: (groupBy) => change({ groupBy: groupBy || null }) }}
          />
        </AzuosFilterField>
      ) : null}
      {isPair(widget.kind) ? (
        <AzuosFilterField data={{ label: 'Dividir por' }}>
          <AzuosSelectField
            data={{ value: widget.splitBy ?? NO_GROUP, options: splitOptions(widget) }}
            ui={{ ariaLabel: 'Dividir por', className: FULL }}
            actions={{ onChange: (splitBy) => change({ splitBy: splitBy || null }) }}
          />
        </AzuosFilterField>
      ) : null}
    </>
  );
}

/**
 * A JANELA DA AGENDA — o quanto ela puxa do banco. Escolhas fechadas (próximos/últimos 7, 14,
 * 30, 60 ou 90 dias; 1 a 12 semanas; 1 a 3 meses), ou duas datas com no máximo 90 dias entre
 * elas. O teto mora no contrato: o servidor recusa o que passar dele.
 */
function WindowFields({
  data,
  actions,
}: {
  data: { window: WidgetWindow };
  actions: Pick<WidgetFormProps['actions'], 'onChange'>;
}) {
  const { window } = data;
  const change = (next: WidgetWindow) => actions.onChange({ window: next });
  const mode = window.mode === 'custom' ? 'custom' : window.direction;

  return (
    <div className="flex flex-col gap-3 sm:col-span-full">
      <AzuosFilterField data={{ label: 'Janela da agenda' }}>
        <AzuosSegmentedControl
          data={{ value: mode, options: WINDOW_MODE_OPTIONS }}
          ui={{ ariaLabel: 'Janela da agenda' }}
          actions={{ onChange: (next) => change(windowForMode(next, window)) }}
        />
      </AzuosFilterField>
      {window.mode === 'relative' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AzuosFilterField data={{ label: 'Contar em' }}>
            <AzuosSelectField
              data={{ value: window.unit, options: UNIT_OPTIONS }}
              ui={{ ariaLabel: 'Contar em', className: FULL }}
              actions={{ onChange: (unit) => change(withUnit(window, unit as WindowUnit)) }}
            />
          </AzuosFilterField>
          <AzuosFilterField data={{ label: 'Quantos' }}>
            <AzuosSelectField
              data={{
                value: String(window.count),
                options: WINDOW_COUNTS[window.unit].map((count) => ({
                  value: String(count),
                  label: `${count} ${WINDOW_UNIT_LABELS[window.unit][count === 1 ? 0 : 1]}`,
                })),
              }}
              ui={{ ariaLabel: 'Quantos', className: FULL }}
              actions={{ onChange: (count) => change({ ...window, count: Number(count) }) }}
            />
          </AzuosFilterField>
        </div>
      ) : (
        <AzuosDateRangeField
          data={{
            label: `Entre as datas (no máximo ${MAX_WINDOW_DAYS} dias)`,
            name: 'agendaRange',
            value: { from: window.from, to: window.to },
          }}
          actions={{
            onChange: (range) =>
              change({
                mode: 'custom',
                from: range.from ?? window.from,
                to: range.to ?? window.to,
              }),
          }}
        />
      )}
      <p className="text-ink-500 text-xs">{windowLabel(window)} · só esses dias saem do banco.</p>
    </div>
  );
}

const WINDOW_MODE_OPTIONS = [
  { value: 'next', label: 'Próximos' },
  { value: 'last', label: 'Últimos' },
  { value: 'custom', label: 'Datas exatas' },
];

const UNIT_OPTIONS = (['day', 'week', 'month'] as const).map((unit) => ({
  value: unit,
  label: WINDOW_UNIT_LABELS[unit][1].replace(/^./, (letter) => letter.toUpperCase()),
}));

/** Trocar o modo guarda o que dá para guardar: datas exatas nascem na janela de agora. */
export function windowForMode(mode: string, current: WidgetWindow): WidgetWindow {
  if (mode === 'custom') {
    if (current.mode === 'custom') return current;

    return { mode: 'custom', ...windowRange(current, todayIso()) };
  }
  const direction = mode === 'last' ? 'last' : 'next';
  if (current.mode === 'relative') return { ...current, direction };

  return { mode: 'relative', unit: 'month', count: 1, direction };
}

/** Trocar a unidade mantém a quantidade se ela existe na nova; senão, a menor. */
export function withUnit(
  window: Extract<WidgetWindow, { mode: 'relative' }>,
  unit: WindowUnit,
): WidgetWindow {
  const counts = WINDOW_COUNTS[unit];
  const count = counts.includes(window.count) ? window.count : (counts[0] ?? 1);

  return { ...window, unit, count };
}

/** O recorte: o período, o filtro salvo e "só os meus". */
function ScopeFields({ data, actions }: WidgetFormProps) {
  const { widget } = data;
  const change = actions.onChange;

  return (
    <>
      {widget.kind === 'agenda' ? (
        <WindowFields data={{ window: widget.window ?? DEFAULT_WINDOW }} actions={actions} />
      ) : (
        <AzuosFilterField data={{ label: 'Período' }}>
          <AzuosSelectField
            data={{ value: widget.period, options: PERIOD_OPTIONS }}
            ui={{ ariaLabel: 'Período', className: FULL }}
            actions={{ onChange: (period) => change({ period: period as WidgetPeriod }) }}
          />
        </AzuosFilterField>
      )}
      {/* Período e filtro lado a lado (o filtro com o botão de montar um novo, mais largo);
          na agenda, a janela já ocupou a linha e o filtro desce para a linha dele. */}
      <div className={widget.kind === 'agenda' ? 'sm:col-span-full' : 'sm:col-span-2'}>
        <AzuosFilterField data={{ label: 'Filtro' }}>
          <div className="flex gap-2">
            <AzuosSelectField
              data={{
                value: widget.filterId ?? NO_FILTER,
                options: filterOptions(data.filters, widget.source),
              }}
              ui={{ ariaLabel: 'Filtro', className: 'min-w-0 flex-1' }}
              actions={{ onChange: (filterId) => change({ filterId: filterId || null }) }}
            />
            <AzuosActionButton
              data={{ label: 'Montar filtro' }}
              ui={{ variant: 'secondary', size: 'lg', icon: ListFilter }}
              actions={{ onClick: actions.onOpenFilters }}
            />
          </div>
        </AzuosFilterField>
      </div>
      {hasPersonField(widget.source) ? (
        <div className="border-border border-t pt-4 sm:col-span-full">
          <AzuosCheckboxField
            data={{
              label: 'Só os meus',
              name: 'widgetOnlyMine',
              description: 'Cada pessoa vê o que é dela — vale também no painel da equipe.',
              isChecked: widget.onlyMine,
            }}
            actions={{ onChange: (onlyMine) => change({ onlyMine }) }}
          />
        </div>
      ) : null}
    </>
  );
}

/** O bloco desenhado como vai ficar no painel, com os números de agora. */
function Preview({
  data,
}: {
  data: { widget: Widget; preview: WidgetState | null; filters: SavedFilter[] };
}) {
  const result = data.preview ?? { data: null, isLoading: true, error: null };
  const filterName = data.widget.filterId
    ? (data.filters.find((filter) => filter.id === data.widget.filterId)?.name ?? null)
    : null;

  return (
    <section
      aria-label="Pré-visualização em tempo real"
      className="bg-mantle flex flex-col gap-3 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-ink-500 text-xs font-semibold">Pré-visualização em tempo real</p>
        <span className="rounded-chip bg-card text-ink-700 px-2 py-0.5 text-xs font-semibold">
          {result.data ? `${result.data.total} ${DATA_SOURCES[data.widget.source].noun}` : '…'}
        </span>
      </div>
      <div className={previewHeightClass(data.widget.kind)}>
        <AzuosBoardWidget
          data={{
            widget: { ...data.widget, title: data.widget.title || 'Sem título' },
            result,
            filterName,
          }}
          state={{ isEditing: false, isPreview: true }}
          actions={{ onEdit: () => undefined, onRemove: () => undefined }}
        />
      </div>
    </section>
  );
}

/**
 * A altura da pré-visualização. O card com anel é um card só: esticado na caixa dos gráficos
 * (`h-96`) ele ficava gordo, com o anel solto no meio — aqui ele tem a altura de uma linha do
 * painel (140px), a mesma em que vai nascer.
 */
export function previewHeightClass(kind: Widget['kind']): string {
  if (kind === 'ringCard') return 'h-36';

  return 'h-96';
}

const SOURCE_OPTIONS = DATA_SOURCE_KEYS.map((key) => ({
  value: key,
  label: DATA_SOURCES[key].label,
}));
const PERIOD_OPTIONS = WIDGET_PERIODS.map((period) => ({
  value: period,
  label: WIDGET_PERIOD_LABELS[period],
}));
