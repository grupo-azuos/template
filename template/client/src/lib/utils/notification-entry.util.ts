/**
 * QUANDO O HERO DE NOTIFICAÇÕES ABRE SOZINHO — só na ENTRADA: numa sessão nova do navegador ou no
 * primeiro acesso do dia. Abrir a cada notificação nova, ou a cada F5, cobria a tela de quem
 * estava trabalhando; o resto do dia, o que chega vira toast e fica no sininho.
 *
 * - Sessão nova: um cookie de sessão (sem validade), que o navegador apaga ao fechar. É o mesmo
 *   para todas as abas: abrir uma aba nova não é sessão nova.
 * - Primeiro acesso do dia: o último dia em que a entrada foi vista, no `localStorage`, contado
 *   em Brasília.
 *
 * As duas marcas levam o `user.id`: em máquina compartilhada, a próxima pessoa tem a entrada dela.
 * Navegador que bloqueia cookie ou `localStorage` lança: a marca é tratada como ausente, e o hero
 * volta a abrir na entrada — nunca some de vez.
 */
const COOKIE_PREFIX = 'azuos-notification-entry-';
const STORAGE_PREFIX = 'azuos:notification-entry:v1:';
const TIME_ZONE = 'America/Sao_Paulo';

/** O dia de hoje em Brasília, `aaaa-mm-dd` — a virada do dia é a da equipe, não a do UTC. */
export function todayInBrasilia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

/** A entrada ainda não foi vista nesta sessão do navegador, ou ainda não foi vista hoje? */
export function isEntryDue(userId: string, today: string): boolean {
  return !hasSessionMark(userId) || readLastDay(userId) !== today;
}

/** Guarda que a entrada desta pessoa já foi vista: nesta sessão e neste dia. */
export function markEntrySeen(userId: string, today: string): void {
  try {
    document.cookie = `${COOKIE_PREFIX}${userId}=1; path=/; SameSite=Lax`;
  } catch {
    // Cookie bloqueado: a próxima entrada abre o hero de novo.
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, today);
  } catch {
    // Armazenamento bloqueado: idem.
  }
}

function hasSessionMark(userId: string): boolean {
  try {
    return document.cookie
      .split(';')
      .some((part) => part.trim().startsWith(`${COOKIE_PREFIX}${userId}=`));
  } catch {
    return false;
  }
}

function readLastDay(userId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
  } catch {
    return null;
  }
}
