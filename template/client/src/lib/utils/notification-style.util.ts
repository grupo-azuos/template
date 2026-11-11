import { BellRing, type LucideIcon, MessageCircle, Siren, Sparkles } from 'lucide-react';

import { type NotificationSeverity } from '@template/shared/schemas/notification.schema';

import { type AzuosCardHue, cardToneClasses, type AzuosCardToneClasses } from './card-tone.util';

/**
 * A CARA DE CADA NÍVEL DE NOTIFICAÇÃO — o mesmo desenho no sininho, no diálogo, no toast e no
 * histórico, para a pessoa aprender a ler o nível pela cor e pelo ícone antes do texto.
 *
 * A cor é só sotaque (bolinha do ícone, selo, título), dos tons sóbrios do `tokens.css`: nunca
 * borda colorida nem fundo cheio no tom.
 */
export type NotificationLook = {
  label: string;
  /** Frase curta do que o nível pede de quem lê — vai no selo do diálogo. */
  ask: string;
  icon: LucideIcon;
  hue: AzuosCardHue;
  tone: AzuosCardToneClasses;
};

const LOOKS: Record<NotificationSeverity, Omit<NotificationLook, 'tone'>> = {
  urgent: { label: 'Urgente', ask: 'Leia antes de continuar', icon: Siren, hue: 'red' },
  important: { label: 'Importante', ask: 'Pede sua atenção hoje', icon: BellRing, hue: 'yellow' },
  normal: { label: 'Aviso', ask: 'Para você acompanhar', icon: MessageCircle, hue: 'blue' },
  info: { label: 'Novidade', ask: 'Para saber', icon: Sparkles, hue: 'green' },
};

export function notificationLook(severity: NotificationSeverity): NotificationLook {
  const look = LOOKS[severity];

  return { ...look, tone: cardToneClasses(look.hue) };
}

/** A ordem de atenção: o diálogo de entrada mostra a urgente primeiro. */
const PRIORITY: Record<NotificationSeverity, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
  info: 3,
};

export function byAttention<T extends { severity: NotificationSeverity; createdAt: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) => PRIORITY[a.severity] - PRIORITY[b.severity] || b.createdAt.localeCompare(a.createdAt),
  );
}

/** "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias" — e a data, depois de uma semana. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;

  return new Date(iso).toLocaleDateString('pt-BR');
}
