import { Bell, CheckCheck, History } from 'lucide-react';
import { useState } from 'react';

import { type Notification } from '@template/shared/schemas/notification.schema';

import { cn } from '../../utils/cn.util';
import {
  type AppShellNotificationPlacement,
  RAIL_BUTTON,
} from '../azuos-app-shell/azuos-app-shell.component';
import { AzuosNotificationCard } from '../azuos-notification-card/azuos-notification-card.component';
import { Popover, PopoverContent, PopoverTrigger } from '../azuos-popover/azuos-popover';
import { AzuosZuzu } from '../azuos-zuzu/azuos-zuzu.component';

/**
 * O SININHO DO APP-SHELL — quantas não lidas, e um clique abre a lista curta delas.
 *
 * Cada linha leva à tela do assunto (e marca como lida). O que não cabe aqui está no histórico,
 * no perfil. O número passa de 99 como "99+": o selo não pode empurrar o menu.
 */
export type AzuosNotificationBellProps = {
  data: { items: Notification[]; unread: number };
  /**
   * Onde o sininho mora no app-shell: no trilho (só o ícone), na barra de uma coluna (ícone e
   * rótulo) ou no topo do conteúdo, no celular. A lista abre para o lado de dentro da tela.
   */
  ui?: { placement?: AppShellNotificationPlacement };
  state?: { isLoading?: boolean; error?: string | null };
  actions: {
    onOpen: (notification: Notification) => void;
    onMarkAllRead: () => void;
    onOpenHistory: () => void;
  };
};

/** Quantas linhas o sininho mostra — mais que isso é histórico. */
const VISIBLE = 8;

const TRIGGER: Record<AppShellNotificationPlacement, string> = {
  rail: RAIL_BUTTON,
  sidebar:
    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex h-10 w-full items-center gap-2 rounded-box px-2 text-sm outline-hidden focus-visible:ring-2 [&>svg]:size-5',
  header:
    'text-ink-700 hover:bg-accent focus-visible:ring-ring/50 inline-flex control-icon-md items-center justify-center rounded-control outline-none focus-visible:ring-[3px]',
};

export function AzuosNotificationBell({ data, ui, state, actions }: AzuosNotificationBellProps) {
  const placement = ui?.placement ?? 'header';
  /* Aberto ou fechado é estado visual do componente: abrir não busca nada. */
  const [isOpen, setIsOpen] = useState(false);
  const close = (run: () => void) => () => {
    setIsOpen(false);
    run();
  };
  const label =
    data.unread === 0
      ? 'Notificações'
      : `Notificações: ${data.unread} não lida${data.unread === 1 ? '' : 's'}`;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <BellTrigger data={{ unread: data.unread, label }} ui={{ placement }} />

      <PopoverContent
        side={placement === 'header' ? 'bottom' : 'right'}
        align="end"
        sideOffset={placement === 'header' ? 4 : 12}
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <header className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
          <span className="text-ink-900 text-sm font-semibold">Notificações</span>
          {data.unread > 0 ? (
            <button
              type="button"
              onClick={actions.onMarkAllRead}
              className="text-ink-600 hover:text-ink-900 inline-flex items-center gap-1 text-xs font-medium"
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Marcar todas como lidas
            </button>
          ) : null}
        </header>

        <BellBody
          data={data}
          state={state}
          actions={{ onOpen: (item) => close(() => actions.onOpen(item))() }}
        />

        <footer className="border-border border-t p-1">
          <button
            type="button"
            onClick={close(actions.onOpenHistory)}
            className="rounded-box text-ink-700 hover:bg-accent flex w-full items-center justify-center gap-2 py-2 text-sm font-medium"
          >
            <History className="size-4" aria-hidden="true" />
            Ver o histórico
          </button>
        </footer>
      </PopoverContent>
    </Popover>
  );
}

function BellBody({
  data,
  state,
  actions,
}: Pick<AzuosNotificationBellProps, 'data' | 'state'> & {
  actions: { onOpen: (notification: Notification) => void };
}) {
  if (state?.error) {
    return (
      <p role="alert" className="text-hue-red px-4 py-6 text-center text-sm font-medium">
        {state.error}
      </p>
    );
  }
  if (state?.isLoading)
    return <p className="text-ink-500 px-4 py-6 text-center text-sm">Carregando…</p>;
  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
        <AzuosZuzu data={{ pose: 'sleeping' }} ui={{ size: 72 }} />
        <p className="text-ink-700 text-sm font-medium">Nada novo por aqui.</p>
        <p className="text-ink-500 text-xs">Quando algo pedir você, aparece neste sininho.</p>
      </div>
    );
  }

  return (
    <ul className={cn('max-h-[60vh] overflow-y-auto p-1')}>
      {data.items.slice(0, VISIBLE).map((item) => (
        <li key={item.id}>
          <AzuosNotificationCard
            data={{ notification: item }}
            actions={{ onOpen: actions.onOpen }}
          />
        </li>
      ))}
    </ul>
  );
}

/** O botão do sininho, com a cara do lugar onde mora e o selo de não lidas. */
function BellTrigger({
  data,
  ui,
}: {
  data: { unread: number; label: string };
  ui: { placement: AppShellNotificationPlacement };
}) {
  const isSidebar = ui.placement === 'sidebar';

  return (
    <PopoverTrigger
      aria-label={data.label}
      title={ui.placement === 'rail' ? data.label : undefined}
      className={cn('relative', TRIGGER[ui.placement])}
    >
      <Bell aria-hidden="true" />
      {isSidebar ? <span className="flex-1 text-left">Notificações</span> : null}
      {data.unread > 0 ? (
        <span
          className={cn(
            'bg-hue-red text-on-hue min-w-5 rounded-full px-1 text-center text-xs leading-5 font-bold',
            !isSidebar && 'absolute -top-1 -right-1',
          )}
        >
          {data.unread > 99 ? '99+' : data.unread}
        </span>
      ) : null}
    </PopoverTrigger>
  );
}
