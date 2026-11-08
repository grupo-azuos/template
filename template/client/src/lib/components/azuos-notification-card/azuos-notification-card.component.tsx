import { ArrowRight } from 'lucide-react';

import { type Notification } from '@template/shared/schemas/notification.schema';

import { cn } from '../../utils/cn.util';
import { notificationLook, timeAgo } from '../../utils/notification-style.util';

/**
 * UMA NOTIFICAÇÃO — a mesma leitura no sininho, no histórico e no diálogo.
 *
 * - `compact`: a linha do sininho e do histórico. A bolinha à direita diz "não lida".
 * - `feature`: o miolo do diálogo de entrada, com o ícone grande e o selo do nível.
 *
 * O nível se lê pela cor do ícone e pelo selo, nunca por borda colorida.
 */
export type AzuosNotificationCardProps = {
  data: { notification: Notification; now?: Date };
  ui?: { variant?: 'compact' | 'feature'; className?: string };
  actions?: { onOpen?: (notification: Notification) => void };
};

export function AzuosNotificationCard({ data, ui, actions }: AzuosNotificationCardProps) {
  if (ui?.variant === 'feature') return <FeatureCard data={data} ui={ui} actions={actions} />;

  return <CompactCard data={data} ui={ui} actions={actions} />;
}

function CompactCard({ data, ui, actions }: AzuosNotificationCardProps) {
  const { notification } = data;
  const look = notificationLook(notification.severity);
  const Icon = look.icon;
  const isUnread = notification.readAt === null;

  return (
    <button
      type="button"
      onClick={() => actions?.onOpen?.(notification)}
      className={cn(
        'rounded-box hover:bg-accent focus-visible:ring-ring/50 flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-[3px]',
        ui?.className,
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          look.tone.dot,
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'text-ink-900 truncate text-sm',
              isUnread ? 'font-semibold' : 'font-medium',
            )}
          >
            {notification.title}
          </span>
          <span className="text-ink-500 shrink-0 text-xs">
            {timeAgo(notification.createdAt, data.now)}
          </span>
        </span>
        <span className="text-ink-600 line-clamp-2 block text-xs">{notification.body}</span>
        <span className={cn('mt-1 block text-xs font-semibold uppercase', look.tone.text)}>
          {look.label}
        </span>
      </span>
      {isUnread ? (
        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', look.tone.swatch)}>
          <span className="sr-only">Não lida</span>
        </span>
      ) : null}
    </button>
  );
}

function FeatureCard({ data, ui, actions }: AzuosNotificationCardProps) {
  const { notification } = data;
  const look = notificationLook(notification.severity);
  const Icon = look.icon;

  return (
    <article className={cn('flex flex-col items-center gap-3 text-center', ui?.className)}>
      <span className={cn('flex size-16 items-center justify-center rounded-full', look.tone.dot)}>
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <span className="rounded-chip bg-muted text-ink-700 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold">
        <span className={cn('size-2 rounded-full', look.tone.swatch)} aria-hidden="true" />
        {look.label} · {look.ask}
      </span>
      <h3 className="text-ink-900 text-xl font-bold text-balance">{notification.title}</h3>
      <p className="text-ink-600 max-w-md text-sm text-pretty">{notification.body}</p>
      <span className="text-ink-500 text-xs">{timeAgo(notification.createdAt, data.now)}</span>
      {notification.action && actions?.onOpen ? (
        <button
          type="button"
          onClick={() => actions?.onOpen?.(notification)}
          className={cn(
            'rounded-control focus-visible:ring-ring/50 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]',
            look.tone.text,
          )}
        >
          {notification.action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </article>
  );
}
