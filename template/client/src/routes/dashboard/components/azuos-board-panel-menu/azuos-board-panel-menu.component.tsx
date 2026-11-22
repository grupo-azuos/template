import { Copy, EllipsisVertical, type LucideIcon, Maximize2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { azuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { Button } from '../../../../lib/components/azuos-button/azuos-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../lib/components/azuos-popover/azuos-popover';
import { cn } from '../../../../lib/utils/cn.util';

/**
 * O MENU DO BLOCO, como o do título de um painel do Grafana: Ver (o bloco na tela cheia), Editar,
 * Duplicar e Remover. Quem só vê o painel tem só o "Ver"; editar, duplicar e remover aparecem
 * para quem pode montar — e mexer num bloco já abre a montagem do painel.
 */
export type AzuosBoardPanelMenuProps = {
  data: { title: string };
  state?: { canEdit?: boolean };
  actions: {
    onView: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onRemove?: () => void;
  };
};

const ITEM_CLASS =
  'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-chip px-3 py-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0';

export function AzuosBoardPanelMenu({ data, state, actions }: AzuosBoardPanelMenuProps) {
  /* `useState` puramente visual: o menu aberto ou fechado. */
  const [isOpen, setIsOpen] = useState(false);
  const canEdit = Boolean(state?.canEdit);
  const pick = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label={`Menu de ${data.title}`}
          className={azuosActionButton({ variant: 'ghost', size: 'lg', isIconOnly: true })}
        >
          <EllipsisVertical aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        role="menu"
        aria-label={`Menu de ${data.title}`}
        className="w-52 max-w-[calc(100vw-2rem)] rounded-surface border-transparent bg-popover p-1.5 shadow-xl ring-1 ring-foreground/8"
      >
        <MenuItem data={{ label: 'Ver', icon: Maximize2 }} actions={{ onClick: pick(actions.onView) }} />
        {canEdit && actions.onEdit ? (
          <MenuItem data={{ label: 'Editar', icon: Pencil }} actions={{ onClick: pick(actions.onEdit) }} />
        ) : null}
        {canEdit && actions.onDuplicate ? (
          <MenuItem
            data={{ label: 'Duplicar', icon: Copy }}
            actions={{ onClick: pick(actions.onDuplicate) }}
          />
        ) : null}
        {canEdit && actions.onRemove ? (
          <>
            <div role="separator" className="-mx-1.5 my-1 h-px bg-border" />
            <MenuItem
              data={{ label: 'Remover', icon: Trash2 }}
              ui={{ isDestructive: true }}
              actions={{ onClick: pick(actions.onRemove) }}
            />
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  data,
  ui,
  actions,
}: {
  data: { label: string; icon: LucideIcon };
  ui?: { isDestructive?: boolean };
  actions: { onClick: () => void };
}) {
  const Icon = data.icon;

  return (
    <button
      type="button"
      role="menuitem"
      onClick={actions.onClick}
      className={cn(
        ITEM_CLASS,
        ui?.isDestructive
          ? 'text-destructive hover:bg-destructive-soft'
          : 'text-foreground hover:bg-hover-veil',
      )}
    >
      <Icon aria-hidden="true" />
      {data.label}
    </button>
  );
}
