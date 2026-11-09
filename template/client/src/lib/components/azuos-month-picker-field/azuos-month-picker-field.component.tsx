import { todayIso } from '@template/shared/domain/calendar-date.util';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

import { monthsOfYear, monthOfIso, shiftYear, yearOfMonth } from '../../utils/calendar-grid.util';
import { cn } from '../../utils/cn.util';
import { formatCalendarMonth } from '../../utils/format-date.util';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  FIELD_CONTROL_CLASS,
  FieldError,
  FieldLabel,
} from '../azuos-rich-text-field/azuos-rich-text-field.component';

/**
 * CAMPO DE MÊS — rótulo, botão com os doze meses e erro, no formato "AAAA-MM".
 *
 * Irmão do `AzuosDatePickerField`, e pelo mesmo motivo: o `<input type="month">` nativo herda o
 * seletor do sistema operacional, que muda de navegador para navegador e não combina com os
 * campos ao lado. Era o ÚLTIMO campo do sistema que ainda abria o controle do navegador.
 *
 * O ano é a navegação, e os doze meses aparecem de uma vez: filtro de mês quase sempre é "este
 * ano" ou "o ano passado", e obrigar a folhear mês a mês seria doze cliques para voltar um ano.
 *
 * O valor continua sendo "AAAA-MM", igual ao campo nativo — quem usa não sabe que trocou.
 */
export type AzuosMonthPickerFieldProps = {
  data: {
    value: string;
    /** Com rótulo ele vira campo de formulário; sem, continua o filtro de lista. */
    label?: string;
    name?: string;
  };
  ui?: { placeholder?: string; ariaLabel?: string; className?: string };
  state?: { error?: string | null; isDisabled?: boolean; isRequired?: boolean };
  actions: { onChange: (value: string) => void };
};

export function AzuosMonthPickerField({ data, ui, state, actions }: AzuosMonthPickerFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const error = state?.error ?? null;

  return (
    <div className={cn('flex flex-col gap-1.5', ui?.className)}>
      {data.label ? (
        <FieldLabel
          data={{ htmlFor: fieldId, label: data.label }}
          state={{ isRequired: state?.isRequired }}
        />
      ) : null}

      <MonthPickerControl
        data={data}
        ui={ui}
        state={state}
        actions={actions}
        ids={{ fieldId, errorId }}
      />

      {error ? <FieldError data={{ id: errorId, message: error }} /> : null}
    </div>
  );
}

function MonthPickerControl({
  data,
  ui,
  state,
  actions,
  ids,
}: {
  data: AzuosMonthPickerFieldProps['data'];
  ui: AzuosMonthPickerFieldProps['ui'];
  state: AzuosMonthPickerFieldProps['state'];
  actions: AzuosMonthPickerFieldProps['actions'];
  ids: { fieldId: string; errorId: string };
}) {
  /* `useState` de estado puramente visual, permitido pela seção 3 do CONTRIBUTING. */
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(() => openingYear(data.value));

  const hasError = Boolean(state?.error);

  /* Reabrir volta ao ano do valor, e não ao ano que a pessoa estava folheando quando fechou. */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) setYear(openingYear(data.value));
  };

  const handlePick = (monthIso: string) => {
    actions.onChange(monthIso);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={ids.fieldId}
          name={data.name}
          type="button"
          disabled={state?.isDisabled}
          aria-label={ui?.ariaLabel}
          aria-invalid={hasError}
          aria-describedby={hasError ? ids.errorId : undefined}
          className={cn(
            FIELD_CONTROL_CLASS,
            'flex items-center gap-2 text-left',
            'outline-none hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-60',
            hasError ? 'border-border bg-destructive-soft' : 'border-input',
            data.value ? 'text-foreground' : 'text-ink-500',
          )}
        >
          <CalendarRange className="size-4 shrink-0 text-ink-500" aria-hidden="true" />
          <span className="truncate capitalize">{triggerLabel(data.value, ui?.placeholder)}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto rounded-surface border-border bg-card p-3 shadow-xl"
        align="start"
      >
        <YearHeader data={{ year }} actions={{ onYearChange: setYear }} />
        <MonthGrid data={{ year, selected: data.value }} actions={{ onPick: handlePick }} />
        <PickerFooter state={{ hasValue: Boolean(data.value) }} actions={{ onPick: handlePick }} />
      </PopoverContent>
    </Popover>
  );
}

/** O ano em que o seletor abre: o do valor, ou o ano corrente quando está vazio. */
function openingYear(value: string): string {
  return yearOfMonth(value) || yearOfMonth(monthOfIso(todayIso()));
}

/**
 * O que o botão mostra: o mês escolhido por extenso, ou o convite para escolher um.
 *
 * Mês que não existe ("2026-13", vindo de importação) cai no convite, e não numa data
 * inventada — `formatCalendarMonth` devolve traço para ele.
 */
function triggerLabel(value: string, placeholder?: string): string {
  const label = formatCalendarMonth(value);
  if (value && label !== '—') return label;

  return placeholder ?? 'Escolher mês';
}

function YearHeader({
  data,
  actions,
}: {
  data: { year: string };
  actions: { onYearChange: (year: string) => void };
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <YearButton
        ui={{ label: 'Ano anterior' }}
        actions={{ onClick: () => actions.onYearChange(shiftYear(data.year, -1)) }}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </YearButton>

      {/* `aria-live` para o leitor de tela anunciar a troca de ano sem reler a grade inteira. */}
      <span aria-live="polite" className="text-sm font-semibold text-ink-700 tabular-nums">
        {data.year}
      </span>

      <YearButton
        ui={{ label: 'Próximo ano' }}
        actions={{ onClick: () => actions.onYearChange(shiftYear(data.year, 1)) }}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </YearButton>
    </div>
  );
}

function YearButton({
  ui,
  actions,
  children,
}: {
  ui: { label: string };
  actions: { onClick: () => void };
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={actions.onClick}
      aria-label={ui.label}
      className="rounded-control p-1.5 text-ink-500 transition-colors hover:bg-accent hover:text-ink-900"
    >
      {children}
    </button>
  );
}

const SHORT_MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

function MonthGrid({
  data,
  actions,
}: {
  data: { year: string; selected: string };
  actions: { onPick: (monthIso: string) => void };
}) {
  const currentMonth = monthOfIso(todayIso());

  return (
    <div role="group" aria-label="Meses" className="grid w-56 grid-cols-3 gap-1">
      {monthsOfYear(data.year).map((monthIso) => (
        <button
          key={monthIso}
          type="button"
          aria-label={formatCalendarMonth(monthIso)}
          aria-pressed={monthIso === data.selected}
          onClick={() => actions.onPick(monthIso)}
          className={monthClassName({
            isSelected: monthIso === data.selected,
            isCurrent: monthIso === currentMonth,
          })}
        >
          {shortMonth(monthIso)}
        </button>
      ))}
    </div>
  );
}

function monthClassName(state: { isSelected: boolean; isCurrent: boolean }): string {
  return cn(
    'rounded-control px-2 py-2 text-sm capitalize transition-colors hover:bg-accent focus-visible:ring-ring',
    'focus-visible:ring-2 focus-visible:outline-none',
    state.isCurrent && !state.isSelected && 'font-bold text-brand-blue-800',
    state.isSelected && 'bg-primary font-bold text-primary-foreground hover:bg-primary',
  );
}

/** "jan", "fev"… sem o ponto que o `Intl` acrescenta em alguns navegadores. */
function shortMonth(monthIso: string): string {
  const month = Number(monthIso.slice(5, 7));

  return SHORT_MONTH.format(new Date(Date.UTC(2026, month - 1, 1))).replace('.', '');
}

/**
 * "Este mês" e "Limpar". O `Limpar` só aparece com mês escolhido: um botão que não tem o que
 * limpar ensina a pessoa a ignorar o rodapé.
 */
function PickerFooter({
  state,
  actions,
}: {
  state: { hasValue: boolean };
  actions: { onPick: (monthIso: string) => void };
}) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
      <button
        type="button"
        onClick={() => actions.onPick(monthOfIso(todayIso()))}
        className="text-xs font-semibold text-brand-blue-800 hover:underline dark:text-foreground"
      >
        Este mês
      </button>

      {state.hasValue ? (
        <button
          type="button"
          onClick={() => actions.onPick('')}
          className="text-xs font-medium text-ink-500 hover:text-ink-900 hover:underline"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}
