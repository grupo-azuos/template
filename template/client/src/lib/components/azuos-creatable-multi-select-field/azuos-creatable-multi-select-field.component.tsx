import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../utils/cn.util';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * ESCOLHER VÁRIOS, COM BUSCA, E CADASTRAR O QUE FALTA — o campo de um catálogo que cresce com o
 * uso e em que um registro leva mais de um item (os tipos de uma solicitação).
 *
 * Marcar não fecha a lista (quem escolhe dois marcaria o segundo com ela fechada), e o que a
 * pessoa digitou e não achou vira a linha "Cadastrar «termo»" no fim. O componente avisa; quem
 * grava o item novo é o view-model (`actions.onCreate`).
 *
 * O gatilho mostra os escolhidos por nome, separados por vírgula — é o que a pessoa confere antes
 * de salvar.
 */
export type AzuosCreatableMultiSelectFieldOption = { value: string; label: string };

export type AzuosCreatableMultiSelectFieldProps = {
  data: { value: string[]; options: AzuosCreatableMultiSelectFieldOption[] };
  ui?: {
    id?: string;
    ariaLabel?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
  };
  state?: { isDisabled?: boolean; isCreating?: boolean };
  actions: { onChange: (value: string[]) => void; onCreate: (label: string) => void };
};

/** Sem acento e sem caixa: "alteracao" acha "Alteração". */
export function optionKey(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** O termo digitado já é uma opção? Então não se oferece cadastrá-lo de novo. */
export function canCreateOption(
  term: string,
  options: readonly AzuosCreatableMultiSelectFieldOption[],
): boolean {
  const key = optionKey(term);
  if (key.length < 2) return false;

  return !options.some((option) => optionKey(option.label) === key);
}

export function toggleValue(value: readonly string[], item: string): string[] {
  return value.includes(item) ? value.filter((current) => current !== item) : [...value, item];
}

/** Os textos do campo, com os padrões resolvidos fora do JSX (cada `??` conta na complexidade). */
function textsOf(ui: AzuosCreatableMultiSelectFieldProps['ui']) {
  return {
    placeholder: ui?.placeholder ?? 'Escolha ou cadastre',
    searchPlaceholder: ui?.searchPlaceholder ?? 'Buscar ou cadastrar',
  };
}

/** Os escolhidos por nome, na ordem das opções. */
export function chosenLabel(
  value: readonly string[],
  options: readonly AzuosCreatableMultiSelectFieldOption[],
): string {
  return options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)
    .join(', ');
}

export function AzuosCreatableMultiSelectField({
  data,
  ui,
  state,
  actions,
}: AzuosCreatableMultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const label = chosenLabel(data.value, data.options);
  const texts = textsOf(ui);

  const create = () => {
    actions.onCreate(term.trim());
    setTerm('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          id={ui?.id}
          aria-label={ui?.ariaLabel}
          disabled={state?.isDisabled}
          className={cn(
            'flex control-lg w-full max-w-full min-w-40 items-center justify-between gap-2 rounded-control border border-input bg-muted px-3 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            ui?.className,
          )}
        >
          <span className={cn('truncate', !label && 'text-muted-foreground')}>
            {label || texts.placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-64 overflow-hidden rounded-surface border-border bg-card p-0 shadow-xl"
      >
        <Command
          className="rounded-surface bg-card"
          filter={(value, search) => (optionKey(value).includes(optionKey(search)) ? 1 : 0)}
        >
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder={texts.searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>Nada com esse nome.</CommandEmpty>
            <CommandGroup>
              {data.options.map((option) => (
                <OptionRow
                  key={option.value}
                  data={{ option }}
                  state={{ isChecked: data.value.includes(option.value) }}
                  actions={{
                    onToggle: () => actions.onChange(toggleValue(data.value, option.value)),
                  }}
                />
              ))}
              <CreateRow
                data={{ term }}
                state={{
                  isVisible: canCreateOption(term, data.options),
                  isDisabled: state?.isCreating,
                }}
                actions={{ onCreate: create }}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function OptionRow({
  data,
  state,
  actions,
}: {
  data: { option: AzuosCreatableMultiSelectFieldOption };
  state: { isChecked: boolean };
  actions: { onToggle: () => void };
}) {
  return (
    <CommandItem
      value={data.option.label}
      onSelect={actions.onToggle}
      aria-checked={state.isChecked}
      className="rounded-chip"
    >
      <Check
        className={cn('size-4 shrink-0', !state.isChecked && 'opacity-0')}
        aria-hidden="true"
      />
      <span className="truncate">{data.option.label}</span>
    </CommandItem>
  );
}

function CreateRow({
  data,
  state,
  actions,
}: {
  data: { term: string };
  state: { isVisible: boolean; isDisabled?: boolean };
  actions: { onCreate: () => void };
}) {
  if (!state.isVisible) return null;

  return (
    <CommandItem
      value={data.term}
      onSelect={actions.onCreate}
      disabled={state.isDisabled}
      className="rounded-chip"
    >
      <Plus className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Cadastrar “{data.term.trim()}”</span>
    </CommandItem>
  );
}
