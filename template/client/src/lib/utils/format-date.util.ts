/**
 * Data para a TELA, sempre em pt-BR e no fuso de quem está olhando.
 *
 * Um lugar só: cada tela chamando `toLocaleString` do seu jeito é como a mesma data aparece
 * "14/09/2026" numa lista e "2026-09-14T12:00:00.000Z" em outra.
 *
 * Texto que não é data devolve traço, nunca "Invalid Date" — e nunca uma data inventada.
 */
const DATE_TIME = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const MONTH_YEAR = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatCalendarMonth(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) return '—';

  const month = Number(match[2]);
  if (month < 1 || month > 12) return '—';

  return MONTH_YEAR.format(new Date(Date.UTC(Number(match[1]), month - 1, 1)));
}

export function formatDateTime(iso: string | null | undefined): string {
  const date = parse(iso);

  return date ? DATE_TIME.format(date) : '—';
}

export function formatDate(iso: string | null | undefined): string {
  const date = parse(iso);

  return date ? DATE_ONLY.format(date) : '—';
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
}
