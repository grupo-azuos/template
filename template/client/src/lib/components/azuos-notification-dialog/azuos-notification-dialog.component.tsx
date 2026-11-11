import { BellRing, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import {
  type Notification,
  type NotificationSeverity,
  NOTIFICATION_SEVERITIES,
  URGENT_READ_SECONDS,
} from '@template/shared/schemas/notification.schema';

import { cn } from '../../utils/cn.util';
import { notificationLook } from '../../utils/notification-style.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../azuos-dialog/azuos-dialog';
import { AzuosNotificationCard } from '../azuos-notification-card/azuos-notification-card.component';
import { AzuosTooltip } from '../azuos-tooltip/azuos-tooltip.component';
import { AzuosZuzu } from '../azuos-zuzu/azuos-zuzu.component';

/**
 * O HERO DE NOTIFICAÇÕES — o diálogo de entrada com todas as não lidas JUNTAS, no azul escuro da
 * marca, largo, em duas colunas:
 *
 * - À ESQUERDA, o recado: o AzuosZuzu, quantas são, um placar por nível (clicar leva ao grupo) e
 *   o botão de sair. Fica parado.
 * - À DIREITA, a lista: um grupo por nível, as URGENTES primeiro, em vermelho. Só ela rola, com
 *   o título de cada grupo preso no alto.
 *
 * Com urgente: o Zuzu de alerta; não há X, Esc nem clique fora, e o "Li e entendi" só libera
 * depois de `URGENT_READ_SECONDS` — ele marca todas como lidas. A urgente não leva a outra tela:
 * sair dali seria pular a leitura. Sem urgente: "Li todas", Esc, X e clique fora marcam todas.
 * Clicar numa das outras abre a tela do assunto (e marca aquela); o resto fica no sininho.
 */
export type AzuosNotificationDialogProps = {
  data: { items: Notification[] };
  state: { isOpen: boolean };
  actions: {
    onOpen: (notification: Notification) => void;
    /** Grava como lidas, numa chamada só. */
    onMarkRead: (ids: string[]) => void;
    onClose: () => void;
  };
};

const GROUP_TITLES: Record<NotificationSeverity, string> = {
  urgent: 'Urgentes',
  important: 'Importantes',
  normal: 'Avisos',
  info: 'Novidades',
};

type Group = { severity: NotificationSeverity; title: string; items: Notification[] };

/** Quanto dura a tremida de "ainda não" — o mesmo tempo do `--animate-nudge` do tokens.css. */
const NUDGE_MS = 400;

/** Quanto tempo a dica "clique em Li e entendi" fica aberta depois de cada tentativa de sair. */
const ASK_MS = 3000;

/** Um grupo por nível que tem notificação, na ordem de atenção: urgente, importante, aviso. */
function groupsOf(items: readonly Notification[]): Group[] {
  return NOTIFICATION_SEVERITIES.map((severity) => ({
    severity,
    title: GROUP_TITLES[severity],
    items: items.filter((item) => item.severity === severity),
  })).filter((group) => group.items.length > 0);
}

export function AzuosNotificationDialog({ data, state, actions }: AzuosNotificationDialogProps) {
  const baseId = useId();
  /* "Ainda não": a janela no meio da tremida, e a dica aberta em cima do "Li e entendi". Estado
     visual do componente — não busca nem grava nada. O relógio de cada um recomeça a cada nova
     tentativa, para a dica não sumir no meio da segunda. */
  const [isShaking, setIsShaking] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  if (data.items.length === 0) return null;
  const groups = groupsOf(data.items);
  const hasUrgent = groups[0]?.severity === 'urgent';
  const groupId = (severity: NotificationSeverity) => `${baseId}-${severity}`;

  const finish = () => {
    actions.onMarkRead(data.items.map((item) => item.id));
    actions.onClose();
  };
  /* Com urgente, clicar fora ou apertar Esc não fecha — e também não fica mudo: a janela treme,
     a dica em cima do "Li e entendi" pede o clique, e o foco vai para ele. */
  const holdOpen = (event: Event) => {
    if (!hasUrgent) return;
    event.preventDefault();
    timers.current.forEach((timer) => window.clearTimeout(timer));
    setIsShaking(true);
    setIsAsking(true);
    /* A tremida dura `--animate-nudge` (0,4 s); depois a classe sai, e a próxima tentativa
       treme de novo. Pelo relógio, e não pelo `animationend`: com menos movimento a animação
       nem roda, e o evento nunca viria. */
    timers.current = [
      window.setTimeout(() => setIsShaking(false), NUDGE_MS),
      window.setTimeout(() => setIsAsking(false), ASK_MS),
    ];
    focusLeave();
  };

  return (
    <Dialog
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open && !hasUrgent) finish();
      }}
    >
      <DialogContent
        showCloseButton={false}
        /* Ao abrir, o foco vai para o botão de sair — e não para o primeiro card, que ficava
           com o anel de foco aceso sem ninguém ter apertado Tab. `preventScroll`: focar o botão
           do pé rolava a janela inteira, e o topo do hero sumia. */
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusLeave();
        }}
        onEscapeKeyDown={holdOpen}
        onInteractOutside={holdOpen}
        className={cn(
          'rounded-surface bg-brand-blue-900 text-on-dark flex h-[min(44rem,90vh)] flex-col gap-0 overflow-hidden border-0 p-0 sm:max-w-5xl md:flex-row',
          isShaking && 'motion-safe:animate-nudge',
        )}
      >
        {hasUrgent ? null : (
          <DialogClose
            aria-label="Fechar"
            className="control-icon-md rounded-control text-on-dark hover:bg-brand-blue-800 focus-visible:ring-ring absolute top-4 right-4 z-20 inline-flex items-center justify-center outline-none focus-visible:ring-2"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        )}

        {/* No celular a coluna do recado vira o topo, a lista vem embaixo e o botão de sair
            desce para o fim (`order`). No computador a coluna tem a altura da janela: o recado
            rola por dentro dela se não couber, e o botão fica preso no pé. */}
        <aside className="contents md:flex md:min-h-0 md:w-80 md:shrink-0 md:flex-col md:gap-5 md:p-8">
          <div className="flex shrink-0 flex-col gap-4 p-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-0">
            <Greeting data={{ total: data.items.length }} ui={{ hasUrgent }} />
            <Scoreboard
              data={{ groups }}
              actions={{ onGoTo: (severity) => scrollListTo(groupId(severity)) }}
            />
          </div>
          <div data-slot="notification-leave" className="order-last shrink-0 p-4 md:p-0">
            <Leave ui={{ hasUrgent, isAsking }} actions={{ onLeave: finish }} />
          </div>
        </aside>

        <div className="bg-brand-blue-800 md:rounded-l-surface relative min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6">
          {groups.map((group) => (
            <NotificationGroup
              key={group.severity}
              data={{ id: groupId(group.severity), group }}
              actions={{ onOpen: actions.onOpen }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** O foco no botão de sair, sem rolar nada: o hero fica onde está. */
function focusLeave(): void {
  document
    .querySelector<HTMLElement>('[data-slot="notification-leave"] button')
    ?.focus({ preventScroll: true });
}

/**
 * Leva a LISTA até o grupo, rolando só ela. O `scrollIntoView` rolava também a janela do
 * diálogo (que corta o que passa da borda), e o hero subia para fora da vista.
 */
function scrollListTo(id: string): void {
  const group = document.getElementById(id);
  group?.parentElement?.scrollTo?.({ top: group.offsetTop, behavior: 'smooth' });
}

/** O recado do topo: o Zuzu, o "Azuos avisa" e quantas são, com o número em destaque. */
function Greeting({ data, ui }: { data: { total: number }; ui: { hasUrgent: boolean } }) {
  const count = data.total === 1 ? 'uma notificação' : `${data.total} notificações`;

  return (
    <div className="flex items-center gap-4 md:flex-col md:items-start">
      <div className="shrink-0 select-none" aria-hidden="true">
        <AzuosZuzu
          data={{ pose: ui.hasUrgent ? 'alert' : 'pointing' }}
          ui={{ size: 128, className: 'size-20 md:size-32' }}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
          <BellRing className="text-accent-hero size-4" aria-hidden="true" />
          Azuos avisa
        </p>
        <DialogTitle className="text-on-dark text-xl leading-snug font-bold md:text-3xl">
          Você tem <span className="text-accent-hero">{count}</span>
        </DialogTitle>
        <DialogDescription className="text-on-dark/80 text-sm">
          {ui.hasUrgent
            ? 'Comece pelas urgentes, em vermelho. As outras abrem com um clique.'
            : 'Clique numa para abrir a tela do assunto.'}
        </DialogDescription>
      </div>
    </div>
  );
}

/** O placar: quantas de cada nível. Cada linha leva ao grupo dela, na lista ao lado. */
function Scoreboard({
  data,
  actions,
}: {
  data: { groups: Group[] };
  actions: { onGoTo: (severity: NotificationSeverity) => void };
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-1">
      {data.groups.map((group) => {
        const look = notificationLook(group.severity);
        const Icon = look.icon;
        const isUrgent = group.severity === 'urgent';

        return (
          <li key={group.severity}>
            <button
              type="button"
              aria-label={`Ir para ${group.title} (${group.items.length})`}
              onClick={() => actions.onGoTo(group.severity)}
              className={cn(
                'rounded-box focus-visible:ring-ring flex h-10 w-full items-center gap-2 px-3 text-left text-sm font-semibold outline-none focus-visible:ring-2',
                isUrgent
                  ? 'bg-hue-red text-on-hue'
                  : 'bg-brand-blue-800 text-on-dark hover:bg-brand-blue-700',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{group.title}</span>
              <span className="tabular-nums">{group.items.length}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Um grupo da lista, com o título preso no alto enquanto ela rola. As urgentes têm o título em
 * vermelho e as linhas sem ação: a urgente se lê ali mesmo.
 */
function NotificationGroup({
  data,
  actions,
}: {
  data: { id: string; group: Group };
  actions: { onOpen: (notification: Notification) => void };
}) {
  const { group } = data;
  const isUrgent = group.severity === 'urgent';
  const Icon = notificationLook(group.severity).icon;

  return (
    <section id={data.id} aria-label={group.title}>
      <h3 className="bg-brand-blue-800 sticky top-0 z-10 flex items-center gap-2 pt-5 pb-2 text-xs font-bold tracking-wider uppercase">
        <span
          className={cn(
            'rounded-chip inline-flex items-center gap-1.5 px-2.5 py-1',
            isUrgent ? 'bg-hue-red text-on-hue' : 'text-on-dark',
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {group.title} ({group.items.length})
        </span>
      </h3>
      <ul className="flex flex-col gap-2">
        {group.items.map((item) => (
          <li key={item.id} className="rounded-box bg-card text-foreground">
            {/* O anel de foco por DENTRO do card: a lista rola e cortava o anel por fora. */}
            <AzuosNotificationCard
              data={{ notification: isUrgent ? { ...item, action: null } : item }}
              ui={{ className: 'focus-visible:ring-inset' }}
              actions={isUrgent ? undefined : { onOpen: actions.onOpen }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A saída: "Li todas" sem urgente; com urgente, o "Li e entendi" que espera a barra encher. */
function Leave({
  ui,
  actions,
}: {
  ui: { hasUrgent: boolean; isAsking?: boolean };
  actions: { onLeave: () => void };
}) {
  if (!ui.hasUrgent) {
    return (
      <AzuosActionButton
        data={{ label: 'Li todas' }}
        ui={{ size: 'lg', className: 'w-full' }}
        actions={{ onClick: actions.onLeave }}
      />
    );
  }

  return (
    <UrgentAcknowledge
      ui={{ isAsking: ui.isAsking ?? false }}
      actions={{ onAcknowledge: actions.onLeave }}
    />
  );
}

/**
 * A trava das urgentes: quantos segundos faltam, escrito em cima da barra BRANCA que enche, e o
 * "Li e entendi" embaixo, que só libera no fim dela. O vermelho fica para o botão: duas coisas
 * vermelhas juntas brigavam pela atenção.
 *
 * Quem tentou sair sem confirmar (`isAsking`) ganha a DICA em cima do botão, apontando para ele —
 * e o mesmo texto, escondido, para o leitor de tela anunciar.
 */
function UrgentAcknowledge({
  ui,
  actions,
}: {
  ui: { isAsking: boolean };
  actions: { onAcknowledge: () => void };
}) {
  const remaining = useCountdown();
  const isLocked = remaining > 0;
  const done = URGENT_READ_SECONDS - remaining;
  const ask = isLocked
    ? `Leia as urgentes: o “Li e entendi” libera em ${remaining} s.`
    : 'Para continuar, clique em “Li e entendi”.';

  return (
    <div className="flex flex-col gap-3">
      <span role="status" className="sr-only">
        {ui.isAsking ? ask : ''}
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-on-dark flex items-baseline justify-between text-xs font-semibold">
          <span>{isLocked ? 'Leia antes de confirmar' : 'Pode confirmar'}</span>
          <span className="tabular-nums">{isLocked ? `${remaining} s` : 'pronto'}</span>
        </p>
        <div className="bg-brand-blue-800 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
          <div
            className="bg-on-dark h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${(done / URGENT_READ_SECONDS) * 100}%` }}
          />
        </div>
      </div>
      {/* O `span` é o gatilho da dica: o botão travado (`disabled`) não recebe eventos. */}
      <AzuosTooltip
        data={{ content: ask }}
        ui={{ side: 'top', className: 'max-w-xs text-center font-semibold' }}
        state={{ isOpen: ui.isAsking }}
      >
        <span className="block">
          <AzuosActionButton
            data={{ label: 'Li e entendi' }}
            ui={{ variant: 'danger', size: 'lg', className: 'w-full' }}
            state={{ isDisabled: isLocked }}
            actions={{ onClick: actions.onAcknowledge }}
          />
        </span>
      </AzuosTooltip>
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
