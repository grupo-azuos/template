import { useState } from 'react';

import { cn } from '../../utils/cn.util';
import { isIsoWithin } from '../../utils/date-input.util';

/**
 * A escolha de uma data EM TRÊS PERGUNTAS: o ano, depois o mês, depois o dia.
 *
 * Um calendário comum abre no mês de hoje, e quem vai informar a data de nascimento escolhe o dia
 * e não percebe que o ano continua sendo o atual — a pessoa "nasce" neste ano. Trocar o ano num
 * calendário comum é um seletor pequeno no cabeçalho, que quem tem pressa não vê.
 *
 * Aqui a ordem é a da resposta mais larga para a mais estreita, e cada tela faz UMA pergunta. Não
 * dá para chegar ao dia sem ter dito o ano. O que já foi respondido fica no topo, como botão: tocar
 * nele volta àquela pergunta.
 *
 * É só o painel — não abre nem fecha nada. Quem o põe dentro de um balão é o `AzuosDateField`.
 *
 * O valor entra e sai como texto ISO (`1990-03-25`), pelo mesmo motivo do `AzuosDatePicker`: é o
 * formato do contrato, e montar o texto pelos números escolhidos não tem fuso para errar.
 */
export type AzuosDateStepperProps = {
  data: {
    /** A data em ISO (`1990-03-25`), ou vazio quando ninguém escolheu. */
    value: string | null;
    /** A primeira data que pode ser escolhida, em ISO. */
    min?: string;
    /** A última data que pode ser escolhida, em ISO. */
    max?: string;
  };
  ui?: {
    /**
     * O ano que a lista mostra ao abrir vazia. Para data de nascimento, um ano perto da idade
     * mais comum de quem preenche poupa a rolagem; sem ele, a lista abre no ano atual.
     */
    startYear?: number;
    className?: string;
  };
  actions: { onChange: (value: string) => void };
};

type Step = 'year' | 'month' | 'day';

const QUESTIONS: Record<Step, string> = {
  year: 'Qual é o ano?',
  month: 'Qual é o mês?',
  day: 'Qual é o dia?',
};

/** Quantos anos para trás e para a frente a lista cobre quando a tela não dá limite. */
const YEARS_BACK = 120;
const YEARS_AHEAD = 10;

const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

/** Os doze meses por extenso, com a primeira letra maiúscula ("Março"). */
const MONTHS = Array.from({ length: 12 }, (_, index) => {
  const name = MONTH_NAME.format(new Date(2024, index, 1, 12));

  return name.charAt(0).toUpperCase() + name.slice(1);
});

const WEEKDAYS = [
  { short: 'D', long: 'Domingo' },
  { short: 'S', long: 'Segunda-feira' },
  { short: 'T', long: 'Terça-feira' },
  { short: 'Q', long: 'Quarta-feira' },
  { short: 'Q', long: 'Quinta-feira' },
  { short: 'S', long: 'Sexta-feira' },
  { short: 'S', long: 'Sábado' },
];

type DateParts = { year: number; month: number; day: number };

/** `1990-03-25` → `{ year: 1990, month: 2, day: 25 }` (mês contado do zero, como no `Date`). */
function partsOf(iso: string | null | undefined): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return null;

  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
}

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysIn(year: number, month: number): number {
  return new Date(year, month + 1, 0, 12).getDate();
}

/** O mês inteiro está fora do limite? Basta conferir o último e o primeiro dia dele. */
function isMonthOut(year: number, month: number, min?: string, max?: string): boolean {
  if (min && isoOf(year, month, daysIn(year, month)) < min.slice(0, 10)) return true;
  if (max && isoOf(year, month, 1) > max.slice(0, 10)) return true;

  return false;
}

function todayParts(): DateParts {
  const now = new Date();

  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

/** A lista de anos, do mais antigo ao mais novo, respeitando o limite da tela. */
function yearsBetween(min: string | undefined, max: string | undefined, today: DateParts) {
  const first = partsOf(min)?.year ?? today.year - YEARS_BACK;
  const last = partsOf(max)?.year ?? today.year + YEARS_AHEAD;

  return Array.from({ length: Math.max(last - first + 1, 1) }, (_, index) => first + index);
}

function cellClassName(state: { isSelected: boolean; isToday?: boolean }, className: string) {
  return cn(
    'rounded-control text-foreground hover:bg-accent cursor-pointer border border-transparent text-sm transition-colors outline-none',
    'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
    state.isToday && 'bg-primary-soft text-primary font-semibold',
    state.isSelected && 'bg-primary text-primary-foreground hover:bg-primary font-semibold',
    className,
  );
}

export function AzuosDateStepper({ data, ui, actions }: AzuosDateStepperProps) {
  const selected = partsOf(data.value);

  /* Com data já escolhida, abre direto no dia: quem volta para corrigir quase sempre errou o dia,
     e o ano e o mês ficam no topo para trocar. Vazio, começa pela primeira pergunta. */
  const [step, setStep] = useState<Step>(selected ? 'day' : 'year');
  const [year, setYear] = useState<number | null>(selected ? selected.year : null);
  const [month, setMonth] = useState<number | null>(selected ? selected.month : null);

  const today = todayParts();

  const chooseYear = (value: number) => {
    setYear(value);
    setStep('month');
  };

  const chooseMonth = (value: number) => {
    setMonth(value);
    setStep('day');
  };

  const chooseDay = (day: number) => {
    if (year !== null && month !== null) {
      actions.onChange(isoOf(year, month, day));
    }
  };

  return (
    <div className={cn('flex w-72 flex-col gap-3 p-3', ui?.className)}>
      <StepHeader
        data={{ step, year, month }}
        actions={{ onBackToYear: () => setStep('year'), onBackToMonth: () => setStep('month') }}
      />
      <StepperBody
        step={step}
        year={year}
        month={month}
        data={data}
        ui={ui}
        today={today}
        selected={selected}
        actions={{ chooseYear, chooseMonth, chooseDay }}
      />
    </div>
  );
}

function StepperBody({
  step,
  year,
  month,
  data,
  ui,
  today,
  selected,
  actions,
}: {
  step: Step;
  year: number | null;
  month: number | null;
  data: AzuosDateStepperProps['data'];
  ui: AzuosDateStepperProps['ui'];
  today: { year: number; month: number; day: number };
  selected: { year: number; month: number; day: number } | null;
  actions: {
    chooseYear: (value: number) => void;
    chooseMonth: (value: number) => void;
    chooseDay: (value: number) => void;
  };
}) {
  if (step === 'year') {
    const focusYear = year ?? ui?.startYear ?? today.year;

    return (
      <YearStep
        data={{
          years: yearsBetween(data.min, data.max, today),
          selectedYear: year,
          focusYear,
          currentYear: today.year,
        }}
        actions={{ onChoose: actions.chooseYear }}
      />
    );
  }

  if (step === 'month' && year !== null) {
    return (
      <MonthStep
        data={{ year, selectedMonth: month, today, min: data.min, max: data.max }}
        actions={{ onChoose: actions.chooseMonth }}
      />
    );
  }

  if (step === 'day' && year !== null && month !== null) {
    return (
      <DayStep
        data={{ year, month, selected, today, min: data.min, max: data.max }}
        actions={{ onChoose: actions.chooseDay }}
      />
    );
  }

  return null;
}

/**
 * A pergunta da vez e o que já foi respondido. Cada resposta é um botão que volta àquela pergunta:
 * é o jeito de corrigir o ano sem ter de fechar e abrir de novo.
 */
function StepHeader({
  data,
  actions,
}: {
  data: { step: Step; year: number | null; month: number | null };
  actions: { onBackToYear: () => void; onBackToMonth: () => void };
}) {
  const hasYear = data.step !== 'year' && data.year !== null;
  const hasMonth = data.step === 'day' && data.month !== null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-ink-900 text-sm font-semibold" aria-live="polite">
        {QUESTIONS[data.step]}
      </p>

      {hasYear ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <AnswerChip
            data={{ label: 'Ano', value: String(data.year) }}
            actions={{ onClick: actions.onBackToYear }}
          />
          {hasMonth ? (
            <AnswerChip
              data={{ label: 'Mês', value: MONTHS[data.month ?? 0] ?? '' }}
              actions={{ onClick: actions.onBackToMonth }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AnswerChip({
  data,
  actions,
}: {
  data: { label: string; value: string };
  actions: { onClick: () => void };
}) {
  return (
    <button
      type="button"
      onClick={actions.onClick}
      aria-label={`${data.label}: ${data.value}. Trocar`}
      className="control-sm rounded-control border-border bg-muted/50 text-ink-700 hover:bg-accent focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1 border text-xs transition-colors outline-none focus-visible:ring-[3px]"
    >
      <span className="text-ink-500">{data.label}:</span>
      <span className="text-ink-900 font-semibold">{data.value}</span>
      <span className="text-primary font-medium underline">trocar</span>
    </button>
  );
}

function YearStep({
  data,
  actions,
}: {
  data: { years: number[]; selectedYear: number | null; focusYear: number; currentYear: number };
  actions: { onChoose: (year: number) => void };
}) {
  /* A lista tem mais de cem anos e rola. O ano de partida nasce no meio da área visível — sem
     isso ela abriria em 1906 e a pessoa teria de rolar um século até o ano dela. */
  const centerFocusYear = (node: HTMLButtonElement | null) => {
    node?.scrollIntoView({ block: 'center' });
  };

  return (
    <div
      role="group"
      aria-label="Anos"
      className="grid max-h-60 grid-cols-4 gap-1 overflow-y-auto pr-1"
    >
      {data.years.map((year) => (
        <button
          key={year}
          ref={year === data.focusYear ? centerFocusYear : undefined}
          type="button"
          aria-pressed={year === data.selectedYear}
          onClick={() => actions.onChoose(year)}
          className={cellClassName(
            { isSelected: year === data.selectedYear, isToday: year === data.currentYear },
            'control-md w-full px-0!',
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

function MonthStep({
  data,
  actions,
}: {
  data: {
    year: number;
    selectedMonth: number | null;
    today: DateParts;
    min?: string;
    max?: string;
  };
  actions: { onChoose: (month: number) => void };
}) {
  return (
    <div role="group" aria-label={`Meses de ${data.year}`} className="grid grid-cols-3 gap-1">
      {MONTHS.map((name, index) => (
        <button
          key={name}
          type="button"
          disabled={isMonthOut(data.year, index, data.min, data.max)}
          aria-pressed={index === data.selectedMonth}
          onClick={() => actions.onChoose(index)}
          className={cellClassName(
            {
              isSelected: index === data.selectedMonth,
              isToday: data.year === data.today.year && index === data.today.month,
            },
            'control-lg w-full px-0!',
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

function DayStep({
  data,
  actions,
}: {
  data: {
    year: number;
    month: number;
    selected: DateParts | null;
    today: DateParts;
    min?: string;
    max?: string;
  };
  actions: { onChoose: (day: number) => void };
}) {
  const { year, month } = data;

  /* Os espaços vazios antes do dia 1 põem cada dia embaixo do dia da semana certo. */
  const blanks = new Date(year, month, 1, 12).getDay();
  const days = Array.from({ length: daysIn(year, month) }, (_, index) => index + 1);

  const isSameMonth = (parts: DateParts | null) => parts?.year === year && parts.month === month;

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-0.5" aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday.long}
            title={weekday.long}
            className="text-ink-500 py-1 text-center text-xs font-medium"
          >
            {weekday.short}
          </span>
        ))}
      </div>

      <div
        role="group"
        aria-label={`Dias de ${MONTHS[month] ?? ''} de ${year}`}
        className="grid grid-cols-7 justify-items-center gap-0.5"
      >
        {Array.from({ length: blanks }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}

        {days.map((day) => {
          const isSelected = isSameMonth(data.selected) && data.selected?.day === day;

          return (
            <button
              key={day}
              type="button"
              disabled={!isIsoWithin(isoOf(year, month, day), data.min, data.max)}
              aria-pressed={isSelected}
              onClick={() => actions.onChoose(day)}
              className={cellClassName(
                { isSelected, isToday: isSameMonth(data.today) && data.today.day === day },
                'control-icon-md',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
