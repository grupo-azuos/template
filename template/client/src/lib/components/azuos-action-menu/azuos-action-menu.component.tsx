import { Ellipsis, type LucideIcon } from 'lucide-react';

import { azuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

/**
 * O MENU DE AÇÕES secundárias: um botão cinza com os três pontinhos e o rótulo, que abre a lista
 * de ações centralizada embaixo do botão, com navegação por teclado.
 *
 * Cada item pode ter ícone, ser destrutivo (em vermelho) e ter um separador antes. Escolher um item
 * só avisa a tela pelo `id`: a confirmação, quando a ação pede uma, fica a cargo de quem usa.
 *
 * - `data.label` e `data.items`: o texto do botão e as ações.
 * - `ui.isIconOnly`: só os três pontinhos, sem o rótulo à vista (o rótulo vira o nome acessível)
 *   — é o menu da linha de tabela e do card, onde a ação não pode ocupar uma coluna inteira.
 * - `state.isDisabled`: trava o botão.
 * - `actions.onSelect(id)`: a ação escolhida.
 */
export type AzuosActionMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  isDestructive?: boolean;
  separatorBefore?: boolean;
};

export type AzuosActionMenuProps = {
  data: { label: string; items: AzuosActionMenuItem[] };
  ui?: { isIconOnly?: boolean };
  state?: { isDisabled?: boolean };
  actions: { onSelect: (id: string) => void };
};

export function AzuosActionMenu({ data, ui, state, actions }: AzuosActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={state?.isDisabled}>
        {ui?.isIconOnly ? (
          <button
            type="button"
            aria-label={data.label}
            className={azuosActionButton({ variant: 'ghost', size: 'sm', isIconOnly: true })}
          >
            <Ellipsis aria-hidden="true" className="mx-auto size-4" />
          </button>
        ) : (
          <button
            type="button"
            className={azuosActionButton({
              variant: 'secondary',
              class: 'inline-flex items-center gap-2 px-4 text-sm',
            })}
          >
            <Ellipsis aria-hidden="true" className="size-4" />
            {data.label}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="rounded-surface bg-popover ring-foreground/8 w-max max-w-[min(26rem,calc(100vw-2rem))] min-w-[max(14rem,var(--radix-dropdown-menu-trigger-width))] border-transparent p-1.5 shadow-xl ring-1"
      >
        {data.items.map((item) => (
          <AzuosActionMenuEntry key={item.id} item={item} onSelect={actions.onSelect} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AzuosActionMenuEntry({
  item,
  onSelect,
}: {
  item: AzuosActionMenuItem;
  onSelect: (id: string) => void;
}) {
  const Icon = item.icon;

  return (
    <>
      {item.separatorBefore ? <DropdownMenuSeparator /> : null}
      <DropdownMenuItem
        variant={item.isDestructive ? 'destructive' : 'default'}
        className="rounded-control min-h-10 cursor-pointer gap-2 px-3 py-2"
        onSelect={() => onSelect(item.id)}
      >
        {Icon ? <Icon aria-hidden="true" /> : null}
        <span className="break-words">{item.label}</span>
      </DropdownMenuItem>
    </>
  );
}
