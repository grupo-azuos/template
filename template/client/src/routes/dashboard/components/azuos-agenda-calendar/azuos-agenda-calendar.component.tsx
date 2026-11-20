import { ptBR } from 'date-fns/locale';
import { createContext, useContext } from 'react';
import { type DayProps } from 'react-day-picker';

import { Calendar } from '../../../../lib/components/azuos-calendar/azuos-calendar';
import { cn } from '../../../../lib/utils/cn.util';

/**
 * A AGENDA DO PAINEL — o calendário do projeto (o do shadcn), um mês ao lado do outro, com quantos
 * itens caem em cada dia da janela (vencimentos, movimentos…). Os dias fora da janela ficam
 * apagados; o dia cheio ganha o fundo da marca, e o número escrito embaixo — a cor nunca é o
 * único jeito de ler. É só leitura: nenhum dia é botão.
 */
export type AzuosAgendaCalendarProps = {
  data: {
    /** Os dias com alguma coisa (`aaaa-mm-dd`). */
    days: readonly { date: string; count: number }[];
    /** A janela pedida, pontas incluídas. */
    range: { from: string; to: string };
    /** O que se conta, no plural: "alvarás". */
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
};

type Counts = { byDay: Map<string, number>; max: number; seriesLabel: string };

const CountsContext = createContext<Counts>({ byDay: new Map(), max: 0, seriesLabel: '' });

export function AzuosAgendaCalendar({ data, state }: AzuosAgendaCalendarProps) {
  if (state?.isLoading) {
    return <div aria-busy="true" className="h-full min-h-40 animate-pulse rounded-box bg-muted" />;
  }
  const counts = countsOf(data.days, data.seriesLabel);
  const from = dateOf(data.range.from);
  const to = dateOf(data.range.to);

  return (
    <CountsContext.Provider value={counts}>
      <div className="h-full overflow-auto">
        <Calendar
          locale={ptBR}
          month={from}
          numberOfMonths={monthsBetween(data.range.from, data.range.to)}
          disableNavigation
          hideNavigation
          showOutsideDays={false}
          disabled={[{ before: from }, { after: to }]}
          className="w-full bg-transparent p-0 [--cell-size:2.5rem]"
          classNames={{
            root: 'w-full',
            months: 'flex flex-wrap gap-6',
            month: 'flex min-w-64 flex-1 flex-col gap-2',
            month_caption: 'flex h-8 items-center text-sm font-bold capitalize text-ink-900',
            weekdays: 'flex',
            weekday: 'flex-1 text-center text-xs font-medium text-muted-foreground',
            week: 'mt-1 flex w-full gap-1',
            day: 'flex-1 p-0',
          }}
          components={{ Day: AgendaDay }}
        />
      </div>
    </CountsContext.Provider>
  );
}

/** Um dia: o número do dia e, embaixo, quantos itens caem nele. */
function AgendaDay({ day, modifiers, children, className, ...props }: DayProps) {
  const counts = useContext(CountsContext);
  const count = counts.byDay.get(day.isoDate) ?? 0;
  const isOff = Boolean(modifiers.disabled);
  const level = isOff ? 'off' : levelOf(count, counts.max);

  return (
    <div
      {...props}
      className={cn(
        className,
        'flex min-h-11 flex-col items-center justify-center rounded-box text-sm leading-none',
        LEVEL_LOOK[level],
        modifiers.today && 'ring-2 ring-ink-900 ring-inset',
      )}
      aria-label={labelOf(day.isoDate, count, counts.seriesLabel, isOff)}
    >
      <span>{children}</span>
      {count > 0 && !isOff ? (
        <span className="mt-0.5 text-xs font-bold tabular-nums">{count}</span>
      ) : null}
    </div>
  );
}

type Level = 'off' | 'none' | 'some' | 'many';

/* Três tons, dos tokens da marca: vazio, com alguma coisa, e o dia mais cheio da janela. */
const LEVEL_LOOK: Record<Level, string> = {
  off: 'text-muted-foreground opacity-40',
  none: 'bg-muted text-ink-700',
  some: 'bg-primary-soft text-primary',
  many: 'bg-primary text-primary-foreground',
};

export function levelOf(count: number, max: number): Exclude<Level, 'off'> {
  if (count <= 0) return 'none';

  return max > 0 && count >= max * 0.66 ? 'many' : 'some';
}

export function countsOf(
  days: AzuosAgendaCalendarProps['data']['days'],
  seriesLabel: string,
): Counts {
  const byDay = new Map(days.map((day) => [day.date, day.count]));

  return { byDay, max: Math.max(0, ...days.map((day) => day.count)), seriesLabel };
}

/** Quantos meses a janela toca — 90 dias podem cair em até quatro meses. */
export function monthsBetween(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);

  return Math.max(1, (toYear! - fromYear!) * 12 + (toMonth! - fromMonth!) + 1);
}

function dateOf(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);

  return new Date(year!, month! - 1, day!);
}

function labelOf(iso: string, count: number, seriesLabel: string, isOff: boolean): string {
  const [year, month, day] = iso.split('-');
  const date = `${day}/${month}/${year}`;
  if (isOff) return `${date}: fora da janela`;

  return `${date}: ${count} ${seriesLabel}`;
}
