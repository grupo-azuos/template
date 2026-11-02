import { Check, ChevronsUpDown, type LucideIcon, Plus } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../utils/cn.util';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';
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
 * Campo de seleção COM PESQUISA — para a lista em que rolar até achar não é viável: dezenas de
 * clientes, de etiquetas, de responsáveis. Para meia dúzia de opções fixas o `AzuosSelectField`
 * continua certo; abrir um campo de busca para três itens é ruído.
 *
 * A SEGUNDA VARIANTE nasce de `actions.onCreate`, não de uma prop de modo. Quando a tela passa
 * essa ação, o que a pessoa digitou e não encontrou vira uma linha "Criar «termo»" no fim da
 * lista; quando não passa, o campo é só busca. É a diferença entre escolher de um catálogo
 * fechado e alimentar um catálogo que cresce com o uso — e quem sabe qual dos dois é a tela, que
 * é quem tem como gravar o item novo. O componente continua puro: ele avisa, não cria.
 */
export type AzuosComboboxFieldOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** A pessoa da opção: quando existe, a foto (ou as iniciais) vem antes do rótulo. */
  personName?: string;
  /** A foto da pessoa. Sem ela, ficam as iniciais de `personName`. */
  avatarUrl?: string | null;
};

export type AzuosComboboxFieldProps = {
  data: { value: string; options: AzuosComboboxFieldOption[] };
  ui?: {
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    createLabel?: string;
    ariaLabel?: string;
    /** O id do gatilho, para um `<label htmlFor>` de fora apontar para ele. */
    id?: string;
    /** O id da mensagem que descreve o campo (o erro, a dica), para o leitor de tela. */
    describedBy?: string;
    className?: string;
  };
  state?: { isDisabled?: boolean; isInvalid?: boolean };
  actions: { onChange: (value: string) => void; onCreate?: (label: string) => void };
};

/** Os textos da lista, com os padrões em português reunidos num lugar só. */
function resolveTexts(ui: NonNullable<AzuosComboboxFieldProps['ui']>) {
  return {
    placeholder: ui.placeholder ?? '',
    search: ui.searchPlaceholder ?? 'Pesquisar…',
    empty: ui.emptyLabel ?? 'Nada encontrado.',
    create: ui.createLabel ?? 'Criar',
    ariaLabel: ui.ariaLabel,
    className: ui.className,
  };
}

/**
 * Oferecer criar? Só quando a tela deu a ação, há algo digitado, e esse nome ainda não existe na
 * lista — duas etiquetas "Urgente" é um problema que nasce aqui e só aparece depois, no banco. A
 * comparação ignora maiúsculas porque quem digita não pensa nelas.
 */
function resolveCanCreate(
  options: AzuosComboboxFieldOption[],
  typed: string,
  onCreate?: (label: string) => void,
) {
  if (!onCreate || typed === '') return false;

  return !options.some((option) => option.label.toLowerCase() === typed.toLowerCase());
}

export function AzuosComboboxField({ data, ui, state, actions }: AzuosComboboxFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');

  const selectedOption = data.options.find((option) => option.value === data.value);
  const typed = term.trim();
  const texts = resolveTexts(ui ?? {});
  const canCreate = resolveCanCreate(data.options, typed, actions.onCreate);

  /* Fechar limpa a busca: reabrir com o termo antigo ainda filtrando mostra uma lista quase
     vazia, e a pessoa não entende para onde foram as opções. */
  function changeOpen(next: boolean) {
    setIsOpen(next);

    if (!next) setTerm('');
  }

  function choose(value: string) {
    actions.onChange(value);
    changeOpen(false);
  }

  function create() {
    actions.onCreate?.(typed);
    changeOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      {/* O degrau `lg` da RÉGUA DE MEDIDAS: este campo fica ao lado de um `AzuosTextField` ou
          dentro de um formulário, e precisa nascer na mesma altura e no mesmo raio dos vizinhos.
          As demais classes repetem as do gatilho do `AzuosSelectField` de propósito — os dois são
          o mesmo campo aos olhos de quem usa, e só diferem por ter busca.

          `min-w-40`: abaixo de 10rem o gatilho cortava o próprio valor ("Todas as ci…", "Bras…"),
          e quem estreitava era a tela por fora. O piso é do campo, não de cada tela. */}
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          id={ui?.id}
          aria-label={texts.ariaLabel}
          aria-invalid={state?.isInvalid || undefined}
          aria-describedby={ui?.describedBy}
          disabled={state?.isDisabled}
          title={selectedOption?.label}
          className={cn(
            'control-lg rounded-control border-input bg-muted text-foreground flex w-full max-w-full min-w-40 items-center justify-between gap-2 border px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none',
            'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            texts.className,
          )}
        >
          <TriggerLabel data={{ option: selectedOption }} ui={{ placeholder: texts.placeholder }} />
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      {/* A LARGURA DA LISTA É A DO GATILHO, com um piso. Sem amarrar, ela se estica até o nome mais
          comprido e nasce mais larga que o diálogo em volta, vazando pelos dois lados; sem o piso
          (`min-w-64`), sob um gatilho estreito a lista cortava cada opção no meio. */}
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        {/* O filtro é o do próprio `cmdk`, por pontuação de semelhança — então "ana s" ainda acha
            "Ana Souza", o que um `includes` não faria. */}
        <Command>
          <CommandInput value={term} onValueChange={setTerm} placeholder={texts.search} />
          <CommandList>
            <CommandEmpty>{texts.empty}</CommandEmpty>
            <CommandGroup>
              {data.options.map((option) => (
                <OptionRow
                  key={option.value}
                  data={{ option }}
                  state={{ isSelected: option.value === data.value }}
                  actions={{ onSelect: () => choose(option.value) }}
                />
              ))}
              {canCreate ? (
                <CreateRow
                  data={{ term: typed }}
                  ui={{ label: texts.create }}
                  actions={{ onSelect: create }}
                />
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** O valor escolhido no gatilho. Sem escolha, o tom de placeholder — nunca o valor cru. */
function TriggerLabel({
  data,
  ui,
}: {
  data: { option?: AzuosComboboxFieldOption };
  ui: { placeholder: string };
}) {
  return (
    <span
      className={cn('flex min-w-0 items-center gap-2', !data.option && 'text-muted-foreground')}
    >
      <OptionLead data={{ option: data.option }} />
      <span className="truncate">{data.option?.label || ui.placeholder}</span>
    </span>
  );
}

/**
 * O que vem antes do rótulo: a foto (ou as iniciais) quando a opção é uma PESSOA, ou o ícone da
 * opção. A foto é a regra do grupo para todo seletor de pessoa — o olho acha o rosto antes de ler o
 * nome. Fica `aria-hidden` porque o nome já está escrito ao lado; lido duas vezes, vira ruído.
 */
function OptionLead({ data }: { data: { option?: AzuosComboboxFieldOption } }) {
  const option = data.option;
  if (option?.personName) {
    return (
      <span aria-hidden="true" className="flex shrink-0">
        <AzuosPersonAvatar
          name={option.personName}
          avatarUrl={option.avatarUrl}
          ui={{ size: 'sm' }}
        />
      </span>
    );
  }

  const Icon = option?.icon;
  if (!Icon) return null;

  return <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />;
}

/** Uma opção da lista. O "visto" marca a escolhida; `truncate` corta o nome, não a tela. */
function OptionRow({
  data,
  state,
  actions,
}: {
  data: { option: AzuosComboboxFieldOption };
  state: { isSelected: boolean };
  actions: { onSelect: () => void };
}) {
  const { option } = data;

  return (
    <CommandItem value={option.label} onSelect={actions.onSelect}>
      <Check
        className={cn('size-4 shrink-0', !state.isSelected && 'opacity-0')}
        aria-hidden="true"
      />
      <OptionLead data={{ option }} />
      <span className="truncate">{option.label}</span>
    </CommandItem>
  );
}

/**
 * A linha "Criar «termo»". O `value` é o próprio termo digitado para que o filtro do `cmdk` nunca
 * a esconda: ela é justamente a saída de quem não achou o que procurava.
 */
function CreateRow({
  data,
  ui,
  actions,
}: {
  data: { term: string };
  ui: { label: string };
  actions: { onSelect: () => void };
}) {
  return (
    <CommandItem value={data.term} onSelect={actions.onSelect}>
      <Plus className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {ui.label} “{data.term}”
      </span>
    </CommandItem>
  );
}
