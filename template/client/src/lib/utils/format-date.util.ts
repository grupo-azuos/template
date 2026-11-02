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
/** Para o DIA de calendário: formatado em UTC, o mesmo fuso em que ele foi lido (ver abaixo). */
const CALENDAR_DAY = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

/** `AAAA-MM-DD`, sem hora: um DIA, e não um instante. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
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

/**
 * **Dia de calendário não tem fuso.** Vencimento, admissão e prazo são DIAS (`2026-10-15`), e
 * `new Date('2026-10-15')` os lê como meia-noite UTC — que em Brasília é 21h do dia 14. Formatar
 * isso no fuso de quem olha mostra um dia ANTES. Por isso o dia é lido e escrito no MESMO fuso
 * (UTC); instante (`2026-09-14T12:00:00.000Z`) continua no fuso de quem está olhando.
 */
export function formatDate(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return '—';

  const isCalendarDay = typeof iso === 'string' && CALENDAR_DATE.test(iso.trim());

  return (isCalendarDay ? CALENDAR_DAY : DATE_ONLY).format(date);
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** `AAAA-MM-DD` → `DD/MM/AAAA` sem passar por `Date`: um dia de calendário não tem fuso. */
export function formatCalendarDate(day: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day ?? '');
  if (!match) return '—';

  const [, year, month, date] = match;

  return `${date}/${month}/${year}`;
}
