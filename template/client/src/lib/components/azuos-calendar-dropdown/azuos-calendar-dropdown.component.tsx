import { ChevronDown } from 'lucide-react';
import { useId, useState, type ChangeEvent, type FocusEvent } from 'react';
import { type DropdownProps } from 'react-day-picker';

import { cn } from '../../utils/cn.util';

/**
 * O seletor de mês e o de ano no título de um calendário — uma lista NOSSA, no lugar do `<select>`
 * nativo que o calendário baixado (`ui/calendar`) traz.
 *
 * O nativo abre a lista do sistema operacional: outra fonte, outra cor, e num ano com cem opções
 * uma lista que cobre a tela inteira. E o `Select` do shadcn não serve aqui: ele abre a lista
 * numa camada flutuante própria, por cima do balão do calendário, e as duas camadas disputam o
 * foco e o clique de fora — a lista fecha o balão, ou não fecha nunca.
 *
 * Esta lista é desenhada DENTRO do painel, sem camada nova: não há o que disputar. Ela fecha ao
 * escolher e ao perder o foco (clique em qualquer outro ponto do painel).
 *
 * AS PROPS NÃO SEGUEM `data/ui/state/actions`, de propósito: quem chama este componente é o
 * calendário, não uma tela. Ele entra em `components={{ Dropdown: AzuosCalendarDropdown }}` e
 * recebe o contrato da biblioteca (`DropdownProps`). Pelo mesmo motivo a escolha é entregue como
 * um evento com `target.value`: o calendário espera o aviso de um `<select>`, e é só isso que lê.
 *
 * Use junto com `formatters={{ formatMonthDropdown: calendarMonthName }}`.
 */
const MONTH_NAME = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

/**
 * O nome do mês na lista, por extenso e em português. O calendário baixado escreve pelo idioma do
 * NAVEGADOR — num navegador em inglês a lista mostrava "Apr" no meio de uma tela em português.
 */
export function calendarMonthName(date: Date): string {
  const name = MONTH_NAME.format(date);

  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function AzuosCalendarDropdown({
  options,
  value,
  onChange,
  disabled,
  ...props
}: DropdownProps) {
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const items = options ?? [];
  const selected = items.find((option) => option.value === Number(value));
  const name = props['aria-label'] ?? '';

  const choose = (next: number) => {
    onChange?.({ target: { value: String(next) } } as ChangeEvent<HTMLSelectElement>);
    setIsOpen(false);
  };

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  };

  /* A opção que está valendo nasce no meio da lista: sem isso a lista de anos abriria em 1926. */
  const centerSelected = (node: HTMLButtonElement | null) => {
    node?.scrollIntoView({ block: 'center' });
  };

  return (
    <div className="relative" onBlur={closeWhenFocusLeaves}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={`${name}: ${selected?.label ?? ''}`}
        onClick={() => setIsOpen((current) => !current)}
        className="control-sm rounded-control border-input bg-card text-foreground hover:bg-accent/60 focus-visible:ring-ring/50 inline-flex cursor-pointer items-center gap-1 border text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {selected?.label}
        <ChevronDown className="text-muted-foreground size-3.5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          id={listId}
          role="listbox"
          aria-label={name}
          className="rounded-box border-border bg-card absolute top-full left-0 z-20 mt-1 flex max-h-56 min-w-full flex-col gap-0.5 overflow-y-auto border p-1 shadow-xl"
        >
          {items.map((option) => {
            const isSelected = option.value === selected?.value;

            return (
              <button
                key={option.value}
                ref={isSelected ? centerSelected : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => choose(option.value)}
                className={cn(
                  'control-sm rounded-chip text-foreground hover:bg-accent shrink-0 cursor-pointer text-left text-sm whitespace-nowrap transition-colors outline-none',
                  'focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-40',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary font-semibold',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
