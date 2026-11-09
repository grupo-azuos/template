import { CalendarRange, Filter, Plus, X } from 'lucide-react';

import { todayIso } from '@template/shared/domain/calendar-date.util';
import {
  BOARD_FILTER_FIELDS,
  BOARD_FILTER_KIND_LABELS,
  BOARD_FILTER_KINDS,
  type BoardFieldFilterKind,
  type BoardFilter,
  type BoardFilterKind,
  type BoardFilterValues,
  DATA_SOURCES,
  type DataField,
  type DataSourceKey,
  isFieldFilterKind,
  MAX_WINDOW_DAYS,
  ME_VALUE,
  type WidgetWindow,
  windowLabel,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosComboboxField } from '../../../../lib/components/azuos-combobox-field/azuos-combobox-field.component';
import { AzuosDateRangeField } from '../../../../lib/components/azuos-date-range-field/azuos-date-range-field.component';
import { AzuosFilterField } from '../../../../lib/components/azuos-filter-field/azuos-filter-field.component';
import {
  AzuosPersonPickerField,
  type AzuosPersonPickerPerson,
} from '../../../../lib/components/azuos-person-picker-field/azuos-person-picker-field.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { optionLabel } from '../azuos-filter-builder-screen/azuos-filter-builder-screen.component';

/**
 * OS FILTROS DO PAINEL — a faixa no alto do dashboard que recorta TODOS os blocos de uma vez:
 * "Pessoa" (cada bloco que tem responsável ou quem fez) e "Período" (no lugar do período de
 * cada bloco, até 90 dias). Inspirado nas variáveis do Grafana, mas com dois filtros fechados:
 * a pessoa escolhe um valor, não escreve consulta.
 *
 * Vendo, só os campos. Montando, cada filtro ganha o "tirar", e os que faltam aparecem para pôr.
 */
export type AzuosBoardFilterBarProps = {
  data: {
    filters: BoardFilter[];
    values: BoardFilterValues;
    /** Quem o filtro "Pessoa" oferece — com foto; o filtro guarda o id. */
    people: AzuosPersonPickerPerson[];
  };
  state?: { isEditing?: boolean };
  actions: {
    onChange: (patch: Partial<BoardFilterValues>) => void;
    onAdd?: (kind: BoardFilterKind) => void;
    onRemove?: (id: string) => void;
  };
};

export function AzuosBoardFilterBar({ data, state, actions }: AzuosBoardFilterBarProps) {
  const isEditing = !!state?.isEditing;
  const missing = BOARD_FILTER_KINDS.filter(
    (kind) => !data.filters.some((filter) => filter.kind === kind),
  );
  if (data.filters.length === 0 && !isEditing) return null;

  return (
    <section
      aria-label="Filtros do painel"
      className="flex flex-wrap items-end gap-3 rounded-surface border border-border bg-card p-4"
    >
      <span className="flex items-center gap-2 self-center text-sm font-semibold text-ink-700">
        <Filter className="size-4" aria-hidden="true" />
        Filtros
      </span>
      {data.filters.map((filter) => (
        <div key={filter.id} className="flex items-end gap-1">
          <FilterControl
            data={{ filter, values: data.values, people: data.people }}
            actions={actions}
          />
          {isEditing && actions.onRemove ? (
            <AzuosActionButton
              data={{ label: `Tirar o filtro ${filter.label}` }}
              ui={{ variant: 'ghost', icon: X, isIconOnly: true, size: 'lg' }}
              actions={{ onClick: () => actions.onRemove?.(filter.id) }}
            />
          ) : null}
        </div>
      ))}
      {isEditing && actions.onAdd
        ? missing.map((kind) => (
            <AzuosActionButton
              key={kind}
              data={{ label: BOARD_FILTER_KIND_LABELS[kind] }}
              ui={{ variant: 'secondary', icon: Plus, size: 'lg' }}
              actions={{ onClick: () => actions.onAdd?.(kind) }}
            />
          ))
        : null}
      {isEditing && data.filters.length === 0 ? (
        <p className="self-center text-xs text-ink-500">
          Ponha um filtro para quem vê recortar todos os blocos de uma vez.
        </p>
      ) : null}
    </section>
  );
}

function FilterControl({
  data,
  actions,
}: {
  data: { filter: BoardFilter; values: BoardFilterValues; people: AzuosPersonPickerPerson[] };
  actions: Pick<AzuosBoardFilterBarProps['actions'], 'onChange'>;
}) {
  const { kind } = data.filter;
  if (isFieldFilterKind(kind)) {
    return (
      <FieldControl
        data={{
          label: data.filter.label,
          value: data.values[kind],
          options: fieldFilterOptions(kind),
        }}
        actions={{ onChange: (value) => actions.onChange({ [kind]: value || null }) }}
      />
    );
  }
  if (kind === 'person') {
    return (
      <PersonControl
        data={{ label: data.filter.label, value: data.values.person, people: data.people }}
        actions={actions}
      />
    );
  }

  return (
    <PeriodControl
      data={{ label: data.filter.label, value: data.values.period }}
      actions={actions}
    />
  );
}

/** "Pessoa": todas, eu, ou alguém da lista. "Eu" serve a todo mundo, cada um vê o seu. */
function PersonControl({
  data,
  actions,
}: {
  data: { label: string; value: string | null; people: AzuosPersonPickerPerson[] };
  actions: Pick<AzuosBoardFilterBarProps['actions'], 'onChange'>;
}) {
  return (
    <AzuosFilterField data={{ label: data.label }} ui={{ className: 'w-60' }}>
      <AzuosPersonPickerField
        data={{
          value: data.value ?? '',
          people: data.people,
          leading: [
            { value: '', label: 'Todas as pessoas' },
            { value: ME_VALUE, label: 'Eu' },
          ],
        }}
        ui={{ ariaLabel: data.label, placeholder: 'Todas as pessoas', className: 'w-full' }}
        actions={{ onChange: (person) => actions.onChange({ person: person || null }) }}
      />
    </AzuosFilterField>
  );
}

/** Mais que isto, a lista ganha busca (regra `select-standard`: acima de 10 opções). */
const MAX_PLAIN_OPTIONS = 10;

/** Os valores de cada filtro de campo, com o rótulo em português. */
export function fieldFilterOptions(kind: BoardFieldFilterKind): { value: string; label: string }[] {
  const [source, field] = Object.entries(BOARD_FILTER_FIELDS[kind])[0] as [DataSourceKey, string];
  const options = (DATA_SOURCES[source].fields as Record<string, DataField>)[field]?.options ?? [];

  return options.map((option) => ({ value: option, label: optionLabel(source, option) }));
}

/** Um filtro de campo: "Todos", ou um valor. Lista longa ganha busca. */
function FieldControl({
  data,
  actions,
}: {
  data: { label: string; value: string | null; options: { value: string; label: string }[] };
  actions: { onChange: (value: string) => void };
}) {
  const options = [{ value: '', label: 'Todos' }, ...data.options];

  return (
    <AzuosFilterField data={{ label: data.label }} ui={{ className: 'w-52' }}>
      {data.options.length > MAX_PLAIN_OPTIONS ? (
        <AzuosComboboxField
          data={{ value: data.value ?? '', options }}
          ui={{
            ariaLabel: data.label,
            placeholder: 'Todos',
            searchPlaceholder: 'Buscar...',
            className: 'w-full',
          }}
          actions={actions}
        />
      ) : (
        <AzuosSelectField
          data={{ value: data.value ?? '', options }}
          ui={{ ariaLabel: data.label, className: 'w-full' }}
          actions={actions}
        />
      )}
    </AzuosFilterField>
  );
}

const relative = (
  direction: 'next' | 'last',
  count: number,
  unit: 'day' | 'week' | 'month',
): WidgetWindow => ({ mode: 'relative', direction, count, unit });

/** Os períodos prontos — o que mais se pergunta, sem abrir calendário. */
export const PERIOD_PRESETS: { value: string; label: string; window: WidgetWindow | null }[] = [
  { value: 'each', label: 'O de cada bloco', window: null },
  { value: 'last-7-day', label: 'Últimos 7 dias', window: relative('last', 7, 'day') },
  { value: 'last-30-day', label: 'Últimos 30 dias', window: relative('last', 30, 'day') },
  { value: 'last-90-day', label: 'Últimos 90 dias', window: relative('last', 90, 'day') },
  { value: 'last-1-month', label: 'Este mês', window: relative('last', 1, 'month') },
  { value: 'next-30-day', label: 'Próximos 30 dias', window: relative('next', 30, 'day') },
  { value: 'custom', label: 'Datas exatas', window: null },
];

/** Qual opção pronta é a janela escolhida — `custom` para datas exatas. */
export function presetOf(window: WidgetWindow | null): string {
  if (!window) return 'each';
  if (window.mode === 'custom') return 'custom';

  return `${window.direction}-${window.count}-${window.unit}`;
}

/** A janela de uma opção pronta. "Datas exatas" nasce nos últimos 30 dias, para ajustar. */
export function windowOfPreset(value: string, today: string): WidgetWindow | null {
  if (value === 'custom') {
    return { mode: 'custom', ...windowRange(relative('last', 30, 'day'), today) };
  }

  return PERIOD_PRESETS.find((preset) => preset.value === value)?.window ?? null;
}

/**
 * Datas exatas nunca passam de 90 dias: a data final escolhida longe demais é puxada para o
 * 90º dia — melhor que recusar sem dizer o que fazer.
 */
export function clampRange(from: string, to: string): { from: string; to: string } {
  const [start, end] = from <= to ? [from, to] : [to, from];
  const limit = new Date(`${start}T00:00:00.000Z`);
  limit.setUTCDate(limit.getUTCDate() + MAX_WINDOW_DAYS - 1);
  const last = limit.toISOString().slice(0, 10);

  return { from: start, to: end > last ? last : end };
}

function PeriodControl({
  data,
  actions,
}: {
  data: { label: string; value: WidgetWindow | null };
  actions: Pick<AzuosBoardFilterBarProps['actions'], 'onChange'>;
}) {
  const preset = presetOf(data.value);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <AzuosFilterField data={{ label: data.label }} ui={{ className: 'w-48' }}>
        <AzuosSelectField
          data={{
            value: preset,
            options: PERIOD_PRESETS.map(({ value, label }) => ({ value, label })),
          }}
          ui={{ ariaLabel: data.label, className: 'w-full' }}
          actions={{
            onChange: (value) =>
              actions.onChange({ period: windowOfPreset(value, todayIso()) }),
          }}
        />
      </AzuosFilterField>
      {data.value?.mode === 'custom' ? (
        <AzuosDateRangeField
          data={{
            label: `Entre (até ${MAX_WINDOW_DAYS} dias)`,
            name: 'boardPeriod',
            value: { from: data.value.from, to: data.value.to },
          }}
          ui={{ className: 'w-64' }}
          actions={{
            onChange: (range) => {
              if (data.value?.mode !== 'custom') return;
              const from = range.from ?? data.value.from;
              const to = range.to ?? data.value.to;
              actions.onChange({ period: { mode: 'custom', ...clampRange(from, to) } });
            },
          }}
        />
      ) : null}
      {data.value ? (
        <p className="flex items-center gap-1 pb-2.5 text-xs text-ink-500">
          <CalendarRange className="size-3.5" aria-hidden="true" />
          {windowLabel(data.value)}
        </p>
      ) : null}
    </div>
  );
}
