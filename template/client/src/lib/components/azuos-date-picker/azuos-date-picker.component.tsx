import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../utils/cn.util';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * A escolha de uma data, num calendário em português.
 *
 * O VALOR ENTRA E SAI COMO TEXTO ISO (`2026-10-20`), e não como `Date`: é o formato do contrato
 * (schema Zod, coluna do banco, corpo da API), e converter nas duas pontas em cada tela é como
 * aparece um registro com um dia de diferença — o `Date` do JavaScript carrega fuso, e meia-noite
 * em Brasília é o dia anterior em UTC. Aqui a conversão acontece UMA vez, com a data montada ao
 * meio-dia local, que é o único horário que não muda de dia em nenhum fuso do Brasil.
 *
 * O campo escondido existe para o formulário nativo enxergar o valor: sem ele, um `FormData` do
 * formulário em volta não traria a data.
 */
export type AzuosDatePickerProps = {
  data: {
    name: string;
    /** A data em ISO (`2026-10-20`), ou vazio quando ninguém escolheu. */
    value: string | null;
  };
  ui?: { placeholder?: string; ariaLabel?: string; className?: string };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string | null) => void };
};

const DISPLAY = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

/**
 * Os rótulos de NAVEGAÇÃO do calendário, em português.
 *
 * O `locale` do `date-fns` traduz os nomes de mês e de dia, mas não estes dois: eles nascem em
 * inglês ("Go to the Previous Month") e só aparecem para quem usa leitor de tela — ou seja, o único
 * lugar da tela em inglês seria justamente o que ninguém vê para conferir.
 */
const NAV_LABELS = {
  labelPrevious: () => 'Ir para o mês anterior',
  labelNext: () => 'Ir para o mês seguinte',
};

/**
 * O texto ISO virando `Date`, ao MEIO-DIA local.
 *
 * `new Date('2026-10-20')` é meia-noite UTC — que no Brasil ainda é o dia 19. O calendário
 * destacaria o dia errado, e o erro só apareceria para quem escolhesse o primeiro dia de um mês.
 *
 * Exportada para ter teste próprio: é a conversão que decide se a data mostrada é a data gravada.
 */
export function dateFromIso(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;

  const parts = value.slice(0, 10).split('-');
  if (parts.length !== 3) return undefined;

  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day, 12);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** O `Date` voltando a texto ISO, pelos campos LOCAIS — nunca por `toISOString`, que é UTC. */
export function isoFromDate(date: Date | undefined): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function AzuosDatePicker({ data, ui, state, actions }: AzuosDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = dateFromIso(data.value);
  const label = selected ? DISPLAY.format(selected) : (ui?.placeholder ?? 'Selecione uma data');

  const choose = (date: Date | undefined) => {
    actions.onChange(isoFromDate(date));
    setIsOpen(false);
  };

  return (
    <div className={cn('relative inline-block w-full', ui?.className)}>
      <input type="hidden" name={data.name} value={data.value ?? ''} readOnly />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={state?.isDisabled}
            aria-label={ui?.ariaLabel}
            className={cn(
              /* O degrau `lg` da régua de medidas: este campo fica ao lado de um `AzuosTextField`
                 num formulário, e tem de ter a altura dele. */
              'control-lg rounded-control',
              'border-border bg-card hover:bg-accent/40 w-full justify-start text-left font-normal shadow-xs transition-colors',
              !selected && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="text-muted-foreground mr-2.5 size-4" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="rounded-surface border-border bg-card w-auto p-0 shadow-xl"
          align="start"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={choose}
            defaultMonth={selected}
            locale={ptBR}
            captionLayout="dropdown"
            labels={NAV_LABELS}
            className="rounded-control border-0 p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
