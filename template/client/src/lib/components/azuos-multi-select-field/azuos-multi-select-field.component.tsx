import { ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useId, useState } from 'react';

import { cn } from '../../utils/cn.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosCheckboxField } from '../azuos-checkbox-field/azuos-checkbox-field.component';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * Um select em que dá para marcar MAIS DE UMA opção — o filtro "Lucro Real e Presumido".
 *
 * O Select do shadcn escolhe uma opção só, por desenho. Aqui o botão tem a mesma cara dele (altura,
 * fundo, seta), mas abre um painel com uma caixa de marcar por opção: marcar não fecha o painel,
 * porque quem quer dois regimes marcaria o segundo com o painel já fechado. "Limpar" no rodapé
 * desmarca tudo de uma vez.
 *
 * O rótulo do botão resume a escolha: nada marcado mostra o `placeholder` ("Todos os regimes"), um
 * ou dois mostram os nomes e três ou mais viram contagem ("3 regimes") — a partir daí os nomes não
 * cabem no botão. O leitor de tela recebe a lista inteira no `aria-label`, seja qual for o resumo.
 *
 * `onChange` devolve a lista NA ORDEM DAS OPÇÕES, e não na ordem em que foram marcadas: a mesma
 * escolha vira sempre a mesma lista, o que faz a URL e o cache da consulta serem os mesmos.
 */
export type AzuosMultiSelectFieldOption = {
  value: string;
  label: string;
  /** A pessoa da opção: quando existe, a foto (ou as iniciais) vem antes do rótulo. */
  personName?: string;
  /** A foto da pessoa. Sem ela, ficam as iniciais de `personName`. */
  avatarUrl?: string | null;
};

export type AzuosMultiSelectFieldProps = {
  data: {
    /** Os valores marcados. */
    values: string[];
    options: AzuosMultiSelectFieldOption[];
    /** O que o botão diz sem nada marcado: "Todos os regimes". */
    placeholder: string;
    /** A palavra da contagem, no plural: "regimes" → "3 regimes". */
    noun: string;
  };
  ui?: {
    /** O nome do campo para o leitor de tela: "Regime". */
    ariaLabel?: string;
    className?: string;
  };
  state?: { isDisabled?: boolean };
  actions: { onChange: (values: string[]) => void };
};

/** Os rótulos marcados, na ordem das opções. Valor sem opção não aparece — não tem nome. */
export function selectedLabels(values: string[], options: AzuosMultiSelectFieldOption[]): string[] {
  return options.filter((option) => values.includes(option.value)).map((option) => option.label);
}

/** O resumo da escolha para o botão, pelas regras do cabeçalho deste arquivo. */
export function summarizeSelection(input: AzuosMultiSelectFieldProps['data']): string {
  const labels = selectedLabels(input.values, input.options);
  if (labels.length === 0) return input.placeholder;
  if (labels.length <= 2) return labels.join(', ');

  return `${labels.length} ${input.noun}`;
}

export function AzuosMultiSelectField({ data, ui, state, actions }: AzuosMultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fieldId = useId();
  const labels = selectedLabels(data.values, data.options);
  const fullLabel = labels.length === 0 ? data.placeholder : labels.join(', ');
  const ariaLabel = ui?.ariaLabel ?? data.placeholder;

  const toggle = (value: string, isChecked: boolean) => {
    const next = new Set(data.values);
    if (isChecked) next.add(value);
    if (!isChecked) next.delete(value);

    actions.onChange(data.options.map((option) => option.value).filter((item) => next.has(item)));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        type="button"
        disabled={state?.isDisabled}
        aria-label={`${ariaLabel}: ${fullLabel}`}
        title={fullLabel}
        className={cn(
          'flex control-lg w-full min-w-40 items-center justify-between gap-2 rounded-control border border-input bg-muted px-3 text-sm whitespace-nowrap text-foreground outline-none',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
          ui?.className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedFaces data={{ values: data.values, options: data.options }} />
          <span className="min-w-0 truncate">{summarizeSelection(data)}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 min-w-64 overflow-hidden rounded-surface border-border bg-card p-0 shadow-xl"
      >
        <ul
          role="group"
          aria-label={ariaLabel}
          onKeyDown={moveFocusWithArrows}
          className="max-h-72 overflow-y-auto p-2"
        >
          {data.options.map((option) => (
            <li
              key={option.value}
              className="flex items-center gap-2 rounded-box px-2 hover:bg-accent"
            >
              <PersonFace data={{ option }} />
              <AzuosCheckboxField
                ui={{ className: 'min-w-0 flex-1' }}
                data={{
                  label: option.label,
                  name: `${fieldId}-${option.value}`,
                  isChecked: data.values.includes(option.value),
                }}
                actions={{ onChange: (isChecked) => toggle(option.value, isChecked) }}
              />
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t border-border px-2 py-1.5">
          <AzuosActionButton
            data={{ label: 'Limpar' }}
            ui={{ variant: 'ghost', size: 'sm' }}
            state={{ isDisabled: data.values.length === 0 }}
            actions={{ onClick: () => actions.onChange([]) }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A foto (ou as iniciais) de uma opção que é PESSOA — a regra do grupo para todo seletor de pessoa.
 * `aria-hidden`: o nome já está escrito ao lado, e lido duas vezes vira ruído.
 */
function PersonFace({ data }: { data: { option: AzuosMultiSelectFieldOption } }) {
  if (!data.option.personName) return null;

  return (
    <span aria-hidden="true" className="flex shrink-0">
      <AzuosPersonAvatar
        name={data.option.personName}
        avatarUrl={data.option.avatarUrl}
        ui={{ size: 'sm' }}
      />
    </span>
  );
}

/**
 * No botão, os rostos de quem está marcado, sobrepostos — no máximo três, que é até onde o resumo
 * ainda mostra nomes ou a contagem cabe ao lado.
 */
const MAX_FACES = 3;

function SelectedFaces({
  data,
}: {
  data: { values: string[]; options: AzuosMultiSelectFieldOption[] };
}) {
  const people = data.options
    .filter((option) => option.personName && data.values.includes(option.value))
    .slice(0, MAX_FACES);
  if (people.length === 0) return null;

  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
      {people.map((option) => (
        <AzuosPersonAvatar
          key={option.value}
          name={option.personName ?? option.label}
          avatarUrl={option.avatarUrl}
          ui={{ size: 'sm', className: 'ring-background ring-2' }}
        />
      ))}
    </span>
  );
}

const ARROW_STEPS: Record<string, 1 | -1 | 'first' | 'last'> = {
  ArrowDown: 1,
  ArrowUp: -1,
  Home: 'first',
  End: 'last',
};

/** Setas e Home/End andam entre as caixas, como num menu. O Tab continua funcionando. */
function moveFocusWithArrows(event: KeyboardEvent<HTMLUListElement>): void {
  const step = ARROW_STEPS[event.key];
  if (step === undefined) return;

  const boxes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="checkbox"]'));
  if (boxes.length === 0) return;

  event.preventDefault();
  boxes[
    targetIndex(step, boxes.indexOf(document.activeElement as HTMLElement), boxes.length)
  ]?.focus();
}

export function targetIndex(
  step: 1 | -1 | 'first' | 'last',
  current: number,
  count: number,
): number {
  if (step === 'first') return 0;
  if (step === 'last') return count - 1;
  if (current === -1) return 0;

  return (current + step + count) % count;
}
