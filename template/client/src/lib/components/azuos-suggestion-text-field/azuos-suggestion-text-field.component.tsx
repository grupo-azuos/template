import { ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useId, useRef, useState } from 'react';

import { cn } from '../../utils/cn.util';
import {
  FIELD_CONTROL_CLASS,
  FieldError,
  FieldLabel,
} from '../azuos-rich-text-field/azuos-rich-text-field.component';

/**
 * Um campo de texto com a lista de opções cadastradas embaixo — Departamento, Cargo, Superior
 * direto.
 *
 * Por que não `<datalist>`: o sistema antigo usou e trocou, porque a lista nativa só aparece
 * DEPOIS de digitar, e a pessoa nunca via o que já estava cadastrado. Aqui a lista inteira abre
 * ao focar o campo e vai filtrando conforme se digita.
 *
 * O campo aceita um valor que NÃO está na lista, de propósito: é assim que o sistema antigo
 * funcionava, e travar obrigaria a pessoa a sair da ficha, ir a Configurações e voltar só para
 * cadastrar um cargo novo — perdendo o que já tinha preenchido.
 *
 * Teclado: seta para baixo/cima percorre, Enter escolhe, Esc fecha. O estado de aberto e de
 * opção ativa é puramente visual (`useState` permitido pela seção 3 do CONTRIBUTING).
 */
export type AzuosSuggestionTextFieldProps = {
  data: {
    label: string;
    name: string;
    value: string;
    options: string[];
    placeholder?: string;
    /** O que dizer quando não há NADA cadastrado — o próximo passo, não só "vazio". */
    emptyMessage?: string;
  };
  ui?: { className?: string };
  state?: {
    error?: string | null;
    isRequired?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
  };
  actions: { onChange: (value: string) => void; onBlur?: () => void };
};

export function AzuosSuggestionTextField({
  data,
  ui,
  state,
  actions,
}: AzuosSuggestionTextFieldProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  /* O filtro só vale depois que a pessoa digita: ao focar, a lista mostra TUDO, mesmo que o
     campo já tenha um valor — é quando ela quer ver as outras opções. */
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const { error, isDisabled, isRequired, className } = resolveView(ui, state);
  const visible = filterOptions(data.options, query);

  const open = (nextQuery = '') => {
    setQuery(nextQuery);
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const pick = (value: string) => {
    actions.onChange(value);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <FieldLabel data={{ htmlFor: inputId, label: data.label }} state={{ isRequired }} />

      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={data.name}
          value={data.value}
          placeholder={data.placeholder}
          autoComplete="off"
          disabled={isDisabled}
          required={isRequired}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onFocus={() => open()}
          onChange={(event) => {
            actions.onChange(event.target.value);
            open(event.target.value);
          }}
          onBlur={() => {
            setIsOpen(false);
            actions.onBlur?.();
          }}
          onKeyDown={(event) =>
            handleKeyDown(event, {
              isOpen,
              count: visible.length,
              activeIndex,
              onMove: (index) => {
                setIsOpen(true);
                setActiveIndex(index);
              },
              onPick: () => pick(visible[activeIndex] ?? data.value),
              onClose: () => setIsOpen(false),
            })
          }
          className={cn(
            FIELD_CONTROL_CLASS,
            /* Espaço à direita para a seta que abre a lista não cair sobre o texto. */
            'pr-9',
            'placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-border bg-destructive-soft' : 'border-input',
          )}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label={`Ver as opções de ${data.label}`}
          disabled={isDisabled}
          /* `mousedown` com `preventDefault`: o foco fica no campo, e o `blur` não fecha a lista
             no mesmo instante em que o clique tenta abri-la. */
          onMouseDown={(event) => {
            event.preventDefault();
            if (isOpen) return setIsOpen(false);
            open();
            inputRef.current?.focus();
          }}
          className="text-ink-500 hover:text-ink-700 absolute inset-y-0 right-0 flex w-9 items-center justify-center"
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>

        {isOpen ? (
          <OptionList
            data={{
              id: listId,
              options: visible,
              value: data.value,
              emptyMessage: emptyMessageOf(data, state),
            }}
            state={{ activeIndex }}
            actions={{ onPick: pick }}
          />
        ) : null}
      </div>

      {error ? <FieldError data={{ id: errorId, message: error }} /> : null}
    </div>
  );
}

function OptionList({
  data,
  state,
  actions,
}: {
  data: { id: string; options: string[]; value: string; emptyMessage: string };
  state: { activeIndex: number };
  actions: { onPick: (value: string) => void };
}) {
  const selectedKey = comparable(data.value);

  return (
    <div
      id={data.id}
      role="listbox"
      className="border-ink-300 bg-card rounded-box absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto border p-1 shadow-xl"
    >
      {data.options.length === 0 ? (
        <p className="text-ink-500 px-2 py-2 text-sm">{data.emptyMessage}</p>
      ) : (
        data.options.map((option, index) => (
          <div
            key={option}
            id={`${data.id}-${index}`}
            role="option"
            aria-selected={comparable(option) === selectedKey}
            /* `mousedown`, e não `click`: o `blur` do campo dispara antes do `click` e fecharia a
               lista antes da escolha chegar. */
            onMouseDown={(event) => {
              event.preventDefault();
              actions.onPick(option);
            }}
            className={cn(
              'text-ink-900 rounded-chip cursor-pointer px-2 py-1.5 text-sm break-words',
              index === state.activeIndex && 'bg-accent',
              comparable(option) === selectedKey && 'font-semibold',
            )}
          >
            {option}
          </div>
        ))
      )}
    </div>
  );
}

function resolveView(
  ui: AzuosSuggestionTextFieldProps['ui'],
  state: AzuosSuggestionTextFieldProps['state'],
) {
  return {
    error: state?.error ?? null,
    isDisabled: state?.isDisabled ?? false,
    isRequired: state?.isRequired ?? false,
    className: ui?.className,
  };
}

function handleKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  input: {
    isOpen: boolean;
    count: number;
    activeIndex: number;
    onMove: (index: number) => void;
    onPick: () => void;
    onClose: () => void;
  },
): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (input.count === 0) return;
    input.onMove(nextIndex(input.activeIndex, input.count, event.key === 'ArrowDown' ? 1 : -1));
    return;
  }
  /* Enter só escolhe quando há opção ativa: sem ela, o Enter segue para o formulário. */
  if (event.key === 'Enter' && input.isOpen && input.activeIndex >= 0) {
    event.preventDefault();
    input.onPick();
    return;
  }
  if (event.key === 'Escape' && input.isOpen) {
    event.stopPropagation();
    input.onClose();
  }
}

function nextIndex(current: number, count: number, step: 1 | -1): number {
  if (current === -1) return step > 0 ? 0 : count - 1;

  return (current + step + count) % count;
}

function comparable(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
}

function filterOptions(options: string[], query: string): string[] {
  const term = comparable(query);
  if (!term) return options;

  return options.filter((option) => comparable(option).includes(term));
}

function emptyMessageOf(
  data: AzuosSuggestionTextFieldProps['data'],
  state: AzuosSuggestionTextFieldProps['state'],
): string {
  if (state?.isLoading) return 'Carregando opções…';
  if (data.options.length > 0)
    return 'Nenhuma opção com esse texto. O que foi digitado vale assim mesmo.';

  return data.emptyMessage ?? 'Nada cadastrado ainda.';
}
