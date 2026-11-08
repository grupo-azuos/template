import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  type Notification,
  URGENT_READ_SECONDS,
} from '@template/shared/schemas/notification.schema';

import { cn } from '../../utils/cn.util';
import { notificationLook } from '../../utils/notification-style.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../azuos-dialog/azuos-dialog';
import { AzuosNotificationCard } from '../azuos-notification-card/azuos-notification-card.component';
import { AzuosZuzu } from '../azuos-zuzu/azuos-zuzu.component';

/**
 * O DIÁLOGO DE ENTRADA — as não lidas no meio da tela, uma de cada vez, a urgente primeiro.
 *
 * - URGENTE: o AzuosZuzu de alerta acompanha; não há X, Esc nem clique fora. O "Li e entendi"
 *   só libera depois de `URGENT_READ_SECONDS` na frente da pessoa — e é ele que marca lida.
 * - As outras: "Próxima" grava a que a pessoa acabou de ler; Esc, X e "Fechar" gravam a da
 *   frente e saem. O que ela não chegou a ver continua no sininho.
 *
 * Cada passo vai ao servidor na hora, numa gravação só: um F5 no meio não traz de volta o que
 * já foi lido.
 */
export type AzuosNotificationDialogProps = {
  data: { items: Notification[] };
  state: { isOpen: boolean };
  actions: {
    onOpen: (notification: Notification) => void;
    /** Grava como lidas — uma chamada por passo, com as que a pessoa acabou de passar. */
    onMarkRead: (ids: string[]) => void;
    onClose: () => void;
  };
};

export function AzuosNotificationDialog({ data, state, actions }: AzuosNotificationDialogProps) {
  const session = data.items.map((item) => item.id).join(',');
  const [cursor, setCursor] = useState({ session, index: 0 });
  /* Um conjunto novo de notificações começa do começo — sem efeito, comparando no render. */
  if (cursor.session !== session) setCursor({ session, index: 0 });
  const index = Math.min(cursor.index, data.items.length - 1);
  const current = data.items[index];
  if (!current) return null;
  const isUrgent = current.severity === 'urgent';

  const finish = () => {
    actions.onMarkRead([current.id]);
    actions.onClose();
  };
  const goTo = (next: number) => setCursor({ session, index: next });
  /* "Próxima" e "Li e entendi" gravam a da frente e seguem; na última, fecham. */
  const advance = () => {
    actions.onMarkRead([current.id]);
    if (index + 1 < data.items.length) return goTo(index + 1);
    actions.onClose();
  };

  return (
    <Dialog
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open && !isUrgent) finish();
      }}
    >
      <DialogContent
        showCloseButton={!isUrgent}
        onEscapeKeyDown={(event) => isUrgent && event.preventDefault()}
        onInteractOutside={(event) => isUrgent && event.preventDefault()}
        className="sm:max-w-lg"
      >
        <DialogHeader className="items-center">
          <DialogTitle className="text-ink-500 text-xs font-semibold tracking-wider uppercase">
            {data.items.length === 1
              ? 'Uma notificação para você'
              : `Notificação ${index + 1} de ${data.items.length}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {notificationLook(current.severity).ask}
          </DialogDescription>
          <Progress data={{ items: data.items, index }} />
        </DialogHeader>

        {isUrgent ? (
          <UrgentNotice
            key={current.id}
            data={{ notification: current }}
            actions={{ onAcknowledge: advance }}
          />
        ) : (
          <>
            <AzuosNotificationCard
              data={{ notification: current }}
              ui={{ variant: 'feature' }}
              actions={{ onOpen: actions.onOpen }}
            />
            <DialogFooter className="sm:justify-between">
              <Pager data={{ index, total: data.items.length }} actions={{ onGoTo: goTo }} />
              <AzuosActionButton
                data={{ label: index + 1 < data.items.length ? 'Próxima' : 'Fechar' }}
                actions={{
                  onClick: advance,
                }}
              />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Pager({
  data,
  actions,
}: {
  data: { index: number; total: number };
  actions: { onGoTo: (index: number) => void };
}) {
  return (
    <span className="flex gap-1">
      <AzuosActionButton
        data={{ label: 'Notificação anterior' }}
        ui={{ variant: 'ghost', size: 'sm', icon: ChevronLeft, isIconOnly: true }}
        state={{ isDisabled: data.index === 0 }}
        actions={{ onClick: () => actions.onGoTo(data.index - 1) }}
      />
      <AzuosActionButton
        data={{ label: 'Notificação seguinte' }}
        ui={{ variant: 'ghost', size: 'sm', icon: ChevronRight, isIconOnly: true }}
        state={{ isDisabled: data.index + 1 >= data.total }}
        actions={{ onClick: () => actions.onGoTo(data.index + 1) }}
      />
    </span>
  );
}

/**
 * A URGENTE: o AzuosZuzu de alerta, o texto, e o "Li e entendi" que só libera depois de
 * `URGENT_READ_SECONDS`. Montada com `key` pela notificação: cada urgente nova recomeça a conta.
 * A ação do assunto não aparece aqui — sair para outra tela seria pular a leitura.
 */
function UrgentNotice({
  data,
  actions,
}: {
  data: { notification: Notification };
  actions: { onAcknowledge: () => void };
}) {
  const remaining = useCountdown();
  const isLocked = remaining > 0;

  return (
    <>
      <div className="flex justify-center">
        <AzuosZuzu data={{ pose: 'alert' }} ui={{ size: 96 }} />
      </div>
      <AzuosNotificationCard
        data={{ notification: { ...data.notification, action: null } }}
        ui={{ variant: 'feature' }}
      />
      <Countdown data={{ remaining }} />
      <DialogFooter>
        <AzuosActionButton
          data={{ label: isLocked ? `Li e entendi (${remaining}s)` : 'Li e entendi' }}
          ui={{ variant: 'danger', className: 'w-full sm:w-auto' }}
          state={{ isDisabled: isLocked }}
          actions={{ onClick: actions.onAcknowledge }}
        />
      </DialogFooter>
    </>
  );
}

/** Uma bolinha por notificação, no tom do nível: a pessoa vê quanto falta e onde está a urgente. */
function Progress({ data }: { data: { items: Notification[]; index: number } }) {
  if (data.items.length < 2) return null;

  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {data.items.map((item, position) => (
        <span
          key={item.id}
          className={cn(
            'h-1.5 rounded-full transition-all',
            notificationLook(item.severity).tone.swatch,
            position === data.index ? 'w-6' : 'w-1.5 opacity-40',
          )}
        />
      ))}
    </span>
  );
}

function Countdown({ data }: { data: { remaining: number } }) {
  const done = URGENT_READ_SECONDS - data.remaining;

  return (
    <div className="bg-muted h-1.5 overflow-hidden rounded-full" aria-hidden="true">
      <div
        className="bg-hue-red h-full rounded-full transition-[width] duration-1000 ease-linear"
        style={{ width: `${(done / URGENT_READ_SECONDS) * 100}%` }}
      />
    </div>
  );
}

/** Os segundos que faltam desde a montagem; o relógio só anda dentro do intervalo. */
function useCountdown(): number {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);

    return () => clearInterval(timer);
  }, []);

  return Math.max(0, URGENT_READ_SECONDS - Math.floor((now - startedAt) / 1000));
}
