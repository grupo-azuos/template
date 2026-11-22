import { CalendarRange, CircleDot, type LucideIcon, UserRound } from 'lucide-react';

import { todayIso } from '@template/shared/domain/calendar-date.util';
import {
  type BoardFilter,
  type BoardFilterDisplay,
  type BoardFilterKind,
  type BoardFilterValues,
  isFieldFilterKind,
  MAX_WINDOW_DAYS,
  ME_VALUE,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosCarousel } from '../../../../lib/components/azuos-carousel/azuos-carousel.component';
import { AzuosComboboxField } from '../../../../lib/components/azuos-combobox-field/azuos-combobox-field.component';
import { AzuosDateRangeField } from '../../../../lib/components/azuos-date-range-field/azuos-date-range-field.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { cn } from '../../../../lib/utils/cn.util';
import { type FilterCounts } from '../../../../lib/view-models/use-dashboard-board.model';
import { type PersonOption } from '../../../../lib/view-models/use-people.model';
import {
  type BoardFilterOption,
  clampRange,
  fieldFilterOptions,
  optionCounts,
  PERIOD_PRESETS,
  personOptions,
  presetOf,
  SEARCH_FROM,
  windowOfPreset,
} from './board-filter.util';

/**
 * UM FILTRO NA BARRA, no estilo do Grafana: uma peça só, com o nome à esquerda e o valor ao lado
 * ("Status da tarefa | Todos ▾") — a lista suspensa ou a busca, na altura de um campo, para a
 * barra inteira caber acima dos blocos. Ou os CARDS: uma faixa com uma opção por quadro, cada um
 * com quantos há nela.
 */
export type BoardFilterControlProps = {
  data: {
    filter: BoardFilter;
    display: BoardFilterDisplay;
    values: BoardFilterValues;
    /** Quem o filtro "Responsável" oferece; o filtro guarda o id. */
    people: readonly PersonOption[];
    counts: FilterCounts | null;
  };
  actions: { onChange: (patch: Partial<BoardFilterValues>) => void };
};

/* O valor ocupa o resto da peça, sem moldura própria: o fundo é o da peça inteira. */
const VALUE_CLASS =
  'h-10 w-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none hover:bg-hover-veil dark:bg-transparent dark:hover:bg-hover-veil';

/* O ícone de cada filtro, ao lado do nome — acha-se o filtro pelo desenho, sem ler. Os filtros
   de campo do projeto levam o ícone de situação. */
const ICONS: Partial<Record<BoardFilterKind, LucideIcon>> = {
  person: UserRound,
  period: CalendarRange,
};

/** Uma célula da grade da barra: a peça e, no período "entre datas", as datas logo abaixo. */
export function BoardFilterControl({ data, actions }: BoardFilterControlProps) {
  const { kind } = data.filter;
  const period = data.values.period;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {data.display === 'cards' ? (
        <FilterCards data={data} actions={actions} />
      ) : (
        <FilterPiece data={data} actions={actions} />
      )}
      {kind === 'period' && period?.mode === 'custom' ? (
        <AzuosDateRangeField
          data={{
            label: `Entre (até ${MAX_WINDOW_DAYS} dias)`,
            name: 'boardPeriod',
            value: { from: period.from, to: period.to },
          }}
          ui={{ className: 'w-full' }}
          actions={{
            onChange: (range) =>
              actions.onChange({
                period: {
                  mode: 'custom',
                  ...clampRange(range.from ?? period.from, range.to ?? period.to),
                },
              }),
          }}
        />
      ) : null}
    </div>
  );
}

/** As opções do filtro: "Todos" primeiro; no Responsável, também o "Eu" — cada um vê o seu. */
export function optionsOf(data: BoardFilterControlProps['data']): BoardFilterOption[] {
  const { kind } = data.filter;
  if (kind === 'period') return PERIOD_PRESETS.map(({ value, label }) => ({ value, label }));
  if (kind === 'person') {
    return [
      { value: '', label: 'Todos' },
      { value: ME_VALUE, label: 'Eu' },
      ...personOptions(data.people),
    ];
  }
  if (isFieldFilterKind(kind)) {
    return [{ value: '', label: 'Todos' }, ...fieldFilterOptions(kind)];
  }

  return [];
}

function valueOf(data: BoardFilterControlProps['data']): string {
  const { kind } = data.filter;
  if (kind === 'period') return presetOf(data.values.period);

  return data.values[kind] ?? '';
}

function chooser(
  kind: BoardFilterKind,
  onChange: BoardFilterControlProps['actions']['onChange'],
): (next: string) => void {
  if (kind === 'period') {
    return (next) => onChange({ period: windowOfPreset(next, todayIso()) });
  }

  return (next) => onChange({ [kind]: next || null });
}

/**
 * A peça: o nome num lado, o valor no outro, numa moldura cinza só — a lista suspensa e a busca
 * com o mesmo fundo, a mesma altura e o mesmo fio entre o nome e o valor.
 */
function FilterPiece({ data, actions }: BoardFilterControlProps) {
  const { filter } = data;
  const Icon = ICONS[filter.kind] ?? CircleDot;

  return (
    <div
      role="group"
      aria-label={filter.label}
      className="rounded-control bg-muted flex h-10 min-w-0 items-stretch overflow-hidden"
    >
      <span
        className="border-border text-muted-foreground flex max-w-[55%] shrink-0 items-center gap-1.5 border-r px-3 text-sm font-medium"
        title={filter.label}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{filter.label}</span>
      </span>
      <PieceValue
        data={{
          label: filter.label,
          value: valueOf(data),
          options: optionsOf(data),
          isSearch: data.display === 'search',
        }}
        actions={{ onChange: chooser(filter.kind, actions.onChange) }}
      />
    </div>
  );
}

/** O valor da peça: a busca (pessoa, lista longa ou escolha de quem montou) ou a lista suspensa. */
function PieceValue({
  data,
  actions,
}: {
  data: { label: string; value: string; options: BoardFilterOption[]; isSearch: boolean };
  actions: { onChange: (value: string) => void };
}) {
  if (data.isSearch || data.options.length > SEARCH_FROM) {
    return (
      <AzuosComboboxField
        data={{ value: data.value, options: data.options }}
        ui={{
          ariaLabel: data.label,
          placeholder: data.options[0]?.label ?? 'Todos',
          searchPlaceholder: 'Buscar...',
          className: VALUE_CLASS,
        }}
        actions={actions}
      />
    );
  }

  return (
    <AzuosSelectField
      data={{ value: data.value, options: data.options }}
      ui={{ ariaLabel: data.label, className: VALUE_CLASS }}
      actions={actions}
    />
  );
}

/**
 * OS CARDS: uma faixa com o nome do filtro e, embaixo, uma opção por quadro, com quantos há nela
 * — escolher é clicar no quadro. Quadros cinza sobre o cartão da barra (card dentro de card não),
 * e o escolhido no azul claro. Num CARROSSEL, e não numa grade que quebra em linhas: a faixa tem
 * sempre a altura de um quadro; o resto fica a um arraste (ou a uma seta) de distância.
 */
function FilterCards({ data, actions }: BoardFilterControlProps) {
  const { filter } = data;
  const Icon = ICONS[filter.kind] ?? CircleDot;
  const value = valueOf(data);
  const amounts = optionCounts(data.counts);
  const choose = chooser(filter.kind, actions.onChange);

  return (
    <div role="radiogroup" aria-label={filter.label} className="flex min-w-0 flex-col gap-2">
      <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {filter.label}
      </span>
      <AzuosCarousel ui={{ ariaLabel: `Opções de ${filter.label}`, itemClassName: 'basis-40' }}>
        {optionsOf(data).map((option) => (
          <OptionCard
            key={option.value || 'all'}
            data={{
              option,
              amount: amounts.get(option.value) ?? 0,
              isLoading: Boolean(data.counts?.isLoading),
            }}
            state={{ isChecked: option.value === value }}
            actions={{ onPick: () => choose(option.value) }}
          />
        ))}
      </AzuosCarousel>
    </div>
  );
}

function OptionCard({
  data,
  state,
  actions,
}: {
  data: { option: BoardFilterOption; amount: number; isLoading: boolean };
  state: { isChecked: boolean };
  actions: { onPick: () => void };
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state.isChecked}
      onClick={actions.onPick}
      className={cn(
        'rounded-control focus-visible:ring-ring/50 flex min-h-16 w-full min-w-0 flex-col items-start justify-center gap-0.5 px-3 py-2 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
        state.isChecked
          ? 'bg-primary-soft text-primary'
          : 'bg-muted text-foreground hover:bg-hover-veil',
      )}
    >
      <span
        className={cn(
          'w-full truncate text-sm font-medium',
          !state.isChecked && 'text-muted-foreground',
        )}
        title={data.option.label}
      >
        {data.option.label}
      </span>
      {/* "Eu" não tem conta própria: cada um que vê é um "eu" diferente. */}
      {data.option.value === ME_VALUE ? null : (
        <span className="text-xl font-bold tabular-nums">
          {data.isLoading ? '…' : data.amount.toLocaleString('pt-BR')}
        </span>
      )}
    </button>
  );
}
