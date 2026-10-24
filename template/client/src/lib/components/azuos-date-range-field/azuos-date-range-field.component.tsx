import { ptBR } from 'date-fns/locale';
import { CalendarRange } from 'lucide-react';
import { useId, useState } from 'react';

import { cn } from '../../utils/cn.util';
import {
  displayFromIso,
  isIsoWithin,
  isoFromDisplay,
  maskDateInput,
} from '../../utils/date-input.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import {
  AzuosCalendarDropdown,
  calendarMonthName,
} from '../azuos-calendar-dropdown/azuos-calendar-dropdown.component';
import { dateFromIso, isoFromDate } from '../azuos-date-picker/azuos-date-picker.component';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * O campo de PERÍODO: de uma data até outra, para filtro e para comparar intervalos.
 *
 * Dois calendários lado a lado, porque um período quase sempre atravessa dois meses e num
 * calendário só a pessoa perde de vista onde começou. O mês e o ano de cada um trocam por um
 * seletor no próprio título — sem ele, voltar um ano são doze toques na seta.
 *
 * Em cima dos calendários ficam os campos "De" e "Até", digitáveis (`dd/mm/aaaa`): quem sabe as
 * datas de cor não precisa procurar o dia, e digitar uma data leva o calendário até ela.
 *
 * NADA É ENTREGUE ANTES DO "APLICAR". Escolher um período são dois toques, e entregar o primeiro
 * faria a tela de trás recarregar com meio período. "Limpar" esvazia e entrega na hora.
 *
 * O valor entra e sai como dois textos ISO (`{ from: '2026-03-01', to: '2026-03-31' }`), pelo
 * mesmo motivo do `AzuosDatePicker`. Os dois campos escondidos levam `<name>From` e `<name>To`
 * para o formulário nativo.
 */
export type AzuosDateRange = { from: string | null; to: string | null };

export type AzuosDateRangeFieldProps = {
  data: {
    label: string;
    name: string;
    value: AzuosDateRange;
    /** A primeira data aceita, em ISO. */
    min?: string;
    /** A última data aceita, em ISO. */
    max?: string;
  };
  ui?: { placeholder?: string; className?: string };
  state?: { error?: string | null; isDisabled?: boolean };
  actions: { onChange: (value: AzuosDateRange) => void };
};

const EMPTY_RANGE: AzuosDateRange = { from: null, to: null };

/** Os rótulos de navegação do calendário, em português — ver `AzuosDatePicker`. */
const NAV_LABELS = {
  labelPrevious: () => 'Ir para o mês anterior',
  labelNext: () => 'Ir para o mês seguinte',
};

/** O período do jeito que aparece no campo fechado. */
export function rangeLabel(value: AzuosDateRange): string {
  if (value.from && value.to)
    return `${displayFromIso(value.from)} até ${displayFromIso(value.to)}`;
  if (value.from) return `A partir de ${displayFromIso(value.from)}`;
  if (value.to) return `Até ${displayFromIso(value.to)}`;

  return '';
}

/**
 * O período em ordem: se a pessoa digitou o fim antes do começo, as duas datas trocam de lugar.
 * Recusar seria pior — ela disse as duas datas certas, só na ordem errada.
 */
export function orderedRange(value: AzuosDateRange): AzuosDateRange {
  if (value.from && value.to && value.from > value.to) return { from: value.to, to: value.from };

  return value;
}

function resolveState(state: AzuosDateRangeFieldProps['state']) {
  return { error: state?.error ?? null, isDisabled: state?.isDisabled ?? false };
}

function resolveUi(ui: AzuosDateRangeFieldProps['ui']) {
  return { className: ui?.className, placeholder: ui?.placeholder ?? 'Selecione o período' };
}

function triggerClassName(state: { hasError: boolean; hasValue: boolean }): string {
  return cn(
    /* O degrau `lg` da régua de medidas (`lib/theme/tokens.css`): este campo divide fileira com os
       outros filtros e tem de ter a altura e o canto deles. */
    'control-lg rounded-control',
    'bg-card hover:bg-accent/40 flex w-full cursor-pointer items-center gap-2.5 border text-left text-sm transition-colors outline-none',
    'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:cursor-not-allowed disabled:opacity-60',
    state.hasError ? 'border-border bg-destructive-soft' : 'border-input',
    state.hasValue ? 'text-foreground' : 'text-muted-foreground',
  );
}

/** Quantos anos o seletor de ano cobre quando a tela não dá limite. */
const YEARS_BACK = 100;
const YEARS_AHEAD = 10;

/**
 * Até onde os seletores de mês e ano vão. Sem isto o calendário para no fim do ano atual, e não
 * dá para marcar um período que termina no ano que vem.
 */
function navigationLimits(min?: string, max?: string) {
  const year = new Date().getFullYear();

  return {
    startMonth: dateFromIso(min) ?? new Date(year - YEARS_BACK, 0, 1, 12),
    endMonth: dateFromIso(max) ?? new Date(year + YEARS_AHEAD, 11, 1, 12),
  };
}

export function AzuosDateRangeField({ data, ui, state, actions }: AzuosDateRangeFieldProps) {
  const triggerId = useId();
  const errorId = triggerId + '-error';
  const [isOpen, setIsOpen] = useState(false);

  const { error, isDisabled } = resolveState(state);
  const { className, placeholder } = resolveUi(ui);
  const hasError = Boolean(error);
  const label = rangeLabel(data.value);

  const deliver = (value: AzuosDateRange) => {
    actions.onChange(value);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={triggerId} className="text-ink-700 text-sm font-medium">
        {data.label}
      </label>

      <input type="hidden" name={`${data.name}From`} value={data.value.from ?? ''} readOnly />
      <input type="hidden" name={`${data.name}To`} value={data.value.to ?? ''} readOnly />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={isDisabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={triggerClassName({ hasError, hasValue: Boolean(label) })}
          >
            <CalendarRange className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label || placeholder}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="rounded-surface border-border bg-card w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0 shadow-xl"
        >
          <RangePanel
            data={{ value: data.value, min: data.min, max: data.max }}
            actions={{ onApply: deliver, onClear: () => deliver(EMPTY_RANGE) }}
          />
        </PopoverContent>
      </Popover>

      {hasError ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * O que há dentro do balão: os dois campos digitáveis, os dois calendários e as ações.
 *
 * O rascunho mora aqui, e não no campo: o balão é desmontado ao fechar, então abrir de novo
 * recomeça do valor que está valendo — quem fechou sem aplicar não encontra meio período escolhido.
 */
function RangePanel({
  data,
  actions,
}: {
  data: { value: AzuosDateRange; min?: string; max?: string };
  actions: { onApply: (value: AzuosDateRange) => void; onClear: () => void };
}) {
  const [draft, setDraft] = useState<AzuosDateRange>(data.value);
  const [month, setMonth] = useState<Date>(dateFromIso(data.value.from) ?? new Date());

  /* Só dá para aplicar um período inteiro: com uma data só, a tela de trás não saberia se é
     "a partir de" ou "até". */
  const isComplete = Boolean(draft.from && draft.to);

  const typeEdge = (edge: keyof AzuosDateRange, iso: string | null) => {
    setDraft((current) => ({ ...current, [edge]: iso }));
    const date = dateFromIso(iso);
    if (date) setMonth(date);
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-2 gap-3">
        <EdgeInput
          data={{ label: 'De', value: draft.from, min: data.min, max: data.max }}
          actions={{ onChange: (iso) => typeEdge('from', iso) }}
        />
        <EdgeInput
          data={{ label: 'Até', value: draft.to, min: data.min, max: data.max }}
          actions={{ onChange: (iso) => typeEdge('to', iso) }}
        />
      </div>

      <Calendar
        mode="range"
        numberOfMonths={2}
        selected={{ from: dateFromIso(draft.from), to: dateFromIso(draft.to) }}
        onSelect={(range) =>
          setDraft({ from: isoFromDate(range?.from), to: isoFromDate(range?.to) })
        }
        month={month}
        onMonthChange={setMonth}
        {...navigationLimits(data.min, data.max)}
        disabled={limitMatchers(data.min, data.max)}
        locale={ptBR}
        captionLayout="dropdown"
        formatters={{ formatMonthDropdown: calendarMonthName }}
        components={{ Dropdown: AzuosCalendarDropdown }}
        /* Sem os dias do mês vizinho: com dois calendários lado a lado, o fim de março aparecia
           de novo no começo do quadro de abril, e o período parecia marcado duas vezes. */
        showOutsideDays={false}
        labels={NAV_LABELS}
        className="rounded-control border-0 p-0"
      />

      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-ink-500 text-xs" aria-live="polite">
          {isComplete ? rangeLabel(orderedRange(draft)) : 'Escolha a data de início e a de fim.'}
        </p>

        <div className="flex items-center gap-2">
          <AzuosActionButton
            data={{ label: 'Limpar' }}
            ui={{ variant: 'ghost' }}
            actions={{ onClick: actions.onClear }}
          />
          <AzuosActionButton
            data={{ label: 'Aplicar' }}
            state={{ isDisabled: !isComplete }}
            actions={{ onClick: () => actions.onApply(orderedRange(draft)) }}
          />
        </div>
      </div>
    </div>
  );
}

/** Os dias que o calendário não deixa escolher, no formato que ele entende. */
function limitMatchers(min?: string, max?: string) {
  const before = dateFromIso(min);
  const after = dateFromIso(max);

  return [...(before ? [{ before }] : []), ...(after ? [{ after }] : [])];
}

/**
 * Uma das pontas do período, digitável. Entrega a data só quando ela fica completa, válida e
 * dentro do limite; apagada, entrega vazio. Texto pela metade fica só no campo.
 */
function EdgeInput({
  data,
  actions,
}: {
  data: { label: string; value: string | null; min?: string; max?: string };
  actions: { onChange: (iso: string | null) => void };
}) {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const type = (raw: string) => {
    const text = maskDateInput(raw);
    setDraft(text);

    if (text === '') {
      actions.onChange(null);

      return;
    }

    const iso = isoFromDisplay(text);
    if (iso && isIsoWithin(iso, data.min, data.max)) actions.onChange(iso);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={inputId} className="text-ink-700 text-xs font-medium">
        {data.label}
      </label>
      <input
        id={inputId}
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={draft ?? displayFromIso(data.value)}
        onChange={(event) => type(event.target.value)}
        /* Ao sair, o campo volta a mostrar a data que está valendo: texto pela metade some, em
           vez de ficar parecendo uma data aceita. */
        onBlur={() => setDraft(null)}
        className="control-lg rounded-control bg-card text-foreground border-input placeholder:text-ink-500 focus-visible:ring-ring/50 w-full min-w-0 border text-sm outline-none focus-visible:ring-[3px]"
      />
    </div>
  );
}
