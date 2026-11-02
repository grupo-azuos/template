import { Check, ChevronDown, LoaderCircle, Plus, Search } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';

import { searchKey } from '../../utils/company-search.util';

import { cn } from '../../utils/cn.util';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * Seletor com busca que também CADASTRA — o campo "Cidade" da empresa.
 *
 * Por que não um `<select>`: a lista vem do banco e não cabe inteira na tela. Por que não um
 * `<input>` com sugestão: ele deixava "Goiania", "GOIÂNIA" e "Goiânia" entrarem como três
 * cidades, e o filtro de município passava a repartir as mesmas empresas.
 *
 * O fluxo é BUSCAR ANTES DE CADASTRAR: a pessoa digita, a lista mostra o que já existe (a
 * comparação sem acento e sem caixa é do servidor), e a opção "Cadastrar" só aparece quando
 * nenhuma opção tem a MESMA chave do que foi digitado. "goias" com "Goiás" na lista não
 * oferece cadastro — oferece Goiás.
 *
 * `useState` aqui é estado visual (aberto, termo, item destacado). Quem busca e quem grava é
 * o view-model, por `actions.onSearch` e `actions.onCreate`.
 */
export type AzuosCreatableComboboxFieldProps = {
  data: { value: string; options: string[] };
  ui?: {
    id?: string;
    ariaLabel?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    /** Rótulo da opção que limpa o campo. Sem ele, o campo não oferece limpar. */
    clearLabel?: string;
    className?: string;
  };
  state?: { isLoading?: boolean; isCreating?: boolean; isDisabled?: boolean };
  actions: {
    onChange: (value: string) => void;
    onSearch: (term: string) => void;
    onCreate: (name: string) => void;
  };
};

type ComboboxItem =
  | { kind: 'clear'; label: string }
  | { kind: 'option'; label: string }
  | { kind: 'create'; label: string };

/** A lista que o teclado percorre, montada num lugar só para a seta e o clique concordarem. */
export function buildComboboxItems(input: {
  term: string;
  options: string[];
  hasValue: boolean;
  clearLabel?: string;
  isLoading?: boolean;
}): ComboboxItem[] {
  const items: ComboboxItem[] = [];
  const typed = input.term.trim().replace(/\s+/g, ' ');

  if (input.clearLabel && input.hasValue && !typed)
    items.push({ kind: 'clear', label: input.clearLabel });
  for (const option of input.options) items.push({ kind: 'option', label: option });

  /* Enquanto a busca não voltou, a lista é a da tecla anterior: oferecer "Cadastrar" nela
     convidaria a criar uma cidade que o servidor ainda ia mostrar. */
  if (!typed || input.isLoading) return items;

  const typedKey = searchKey(typed);
  const exists = input.options.some((option) => searchKey(option) === typedKey);
  if (!exists) items.push({ kind: 'create', label: typed });

  return items;
}

export function AzuosCreatableComboboxField({
  data,
  ui,
  state,
  actions,
}: AzuosCreatableComboboxFieldProps) {
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const items = buildComboboxItems({
    term,
    options: data.options,
    hasValue: !!data.value,
    clearLabel: ui?.clearLabel,
    isLoading: state?.isLoading,
  });

  const changeOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) return;

    /* Abrir sempre começa do zero: o termo da última abertura não diz nada sobre o que a
       pessoa procura agora. */
    setTerm('');
    setActiveIndex(0);
    actions.onSearch('');
  };

  const changeTerm = (next: string) => {
    setTerm(next);
    setActiveIndex(0);
    actions.onSearch(next);
  };

  const choose = (item: ComboboxItem | undefined) => {
    if (!item) return;

    if (item.kind === 'create') actions.onCreate(item.label);
    if (item.kind === 'option') actions.onChange(item.label);
    if (item.kind === 'clear') actions.onChange('');
    setIsOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      /* Enter dentro do diálogo não pode enviar o formulário da empresa. */
      event.preventDefault();
      choose(items[activeIndex]);

      return;
    }

    const next = moveHighlight(event.key, activeIndex, items.length);
    if (next === null) return;

    event.preventDefault();
    setActiveIndex(next);
  };

  return (
    /* `modal`: dentro do diálogo da empresa, o bloqueio de rolagem do diálogo engoliria a
       roda do mouse na lista, que é renderizada fora dele. Modal, o popover assume o bloqueio. */
    <Popover open={isOpen} onOpenChange={changeOpen} modal>
      <ComboboxTrigger data={{ value: data.value, listId }} ui={ui} state={{ ...state, isOpen }} />

      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <ComboboxSearch
          data={{
            term,
            listId,
            activeId: items[activeIndex] ? `${listId}-${activeIndex}` : undefined,
          }}
          ui={ui}
          state={state}
          actions={{ onTermChange: changeTerm, onKeyDown }}
        />

        <ComboboxList
          data={{ listId, items, value: data.value, activeIndex }}
          state={{ isLoading: state?.isLoading }}
          actions={{ onChoose: choose, onHighlight: setActiveIndex }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** A posição destacada depois de uma seta, ou `null` quando a tecla não é de navegação. */
function moveHighlight(key: string, current: number, length: number): number | null {
  if (key === 'ArrowDown') return Math.min(current + 1, length - 1);
  if (key === 'ArrowUp') return Math.max(current - 1, 0);

  return null;
}

function ComboboxTrigger({
  data,
  ui,
  state,
}: {
  data: { value: string; listId: string };
  ui: AzuosCreatableComboboxFieldProps['ui'];
  state: NonNullable<AzuosCreatableComboboxFieldProps['state']> & { isOpen: boolean };
}) {
  return (
    <PopoverTrigger
      id={ui?.id}
      type="button"
      role="combobox"
      aria-label={ui?.ariaLabel}
      aria-expanded={state.isOpen}
      aria-controls={data.listId}
      disabled={state.isDisabled}
      className={cn(
        /* O degrau `lg` da régua de medidas (`lib/theme/tokens.css`) e o raio de controle, os mesmos do
           `AzuosTextField` e do `AzuosSelectField`. */
        'control-lg rounded-control border-input bg-muted text-foreground flex w-full min-w-40 items-center justify-between gap-2 border px-3 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        ui?.className,
      )}
    >
      <span className={cn('truncate', !data.value && 'text-muted-foreground')}>
        {data.value || ui?.placeholder}
      </span>
      {state.isCreating ? (
        <LoaderCircle size={16} aria-hidden="true" className="shrink-0 animate-spin opacity-50" />
      ) : (
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 opacity-50" />
      )}
    </PopoverTrigger>
  );
}

function ComboboxSearch({
  data,
  ui,
  state,
  actions,
}: {
  data: { term: string; listId: string; activeId: string | undefined };
  ui: AzuosCreatableComboboxFieldProps['ui'];
  state: AzuosCreatableComboboxFieldProps['state'];
  actions: {
    onTermChange: (term: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
}) {
  return (
    <div className="flex items-center gap-2 border-b px-3">
      <Search size={14} aria-hidden="true" className="text-muted-foreground shrink-0" />
      <input
        autoFocus
        value={data.term}
        onChange={(event) => actions.onTermChange(event.target.value)}
        onKeyDown={actions.onKeyDown}
        placeholder={ui?.searchPlaceholder}
        aria-label={ui?.searchPlaceholder ?? ui?.ariaLabel}
        aria-controls={data.listId}
        aria-activedescendant={data.activeId}
        className="control-lg rounded-control bg-muted placeholder:text-muted-foreground w-full px-2 text-sm outline-none"
      />
      {state?.isLoading ? (
        <LoaderCircle
          size={14}
          aria-hidden="true"
          className="text-muted-foreground shrink-0 animate-spin"
        />
      ) : null}
    </div>
  );
}

function ComboboxList({
  data,
  state,
  actions,
}: {
  data: { listId: string; items: ComboboxItem[]; value: string; activeIndex: number };
  state: { isLoading?: boolean };
  actions: { onChoose: (item: ComboboxItem) => void; onHighlight: (index: number) => void };
}) {
  if (data.items.length === 0) {
    return (
      <p className="text-muted-foreground px-3 py-4 text-center text-xs">
        {state.isLoading ? 'Buscando…' : 'Digite para buscar ou cadastrar'}
      </p>
    );
  }

  return (
    <ul id={data.listId} role="listbox" className="max-h-60 overflow-y-auto p-1">
      {data.items.map((item, index) => (
        <li
          key={`${item.kind}-${item.label}`}
          id={`${data.listId}-${index}`}
          role="option"
          aria-selected={item.kind === 'option' && item.label === data.value}
          onMouseMove={() => actions.onHighlight(index)}
          onClick={() => actions.onChoose(item)}
          className={cn(
            'rounded-chip flex cursor-default items-center gap-2 px-2 py-1.5 text-sm select-none',
            index === data.activeIndex && 'bg-accent text-accent-foreground',
            item.kind === 'create' && 'text-brand-blue-800 mt-1 border-t pt-2 font-medium',
            item.kind === 'clear' && 'text-muted-foreground italic',
          )}
        >
          <ComboboxItemLabel data={{ item, value: data.value }} />
        </li>
      ))}
    </ul>
  );
}

function ComboboxItemLabel({ data }: { data: { item: ComboboxItem; value: string } }) {
  const { item } = data;

  if (item.kind === 'create') {
    return (
      <>
        <Plus size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Cadastrar “{item.label}”</span>
      </>
    );
  }

  return (
    <>
      <Check
        size={14}
        aria-hidden="true"
        className={cn(
          'shrink-0',
          item.kind === 'option' && item.label === data.value ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span className="truncate">{item.label}</span>
    </>
  );
}
