import { describe, expect, it } from 'vitest';

import { formatCalendarDate, formatDate, formatDateTime, formatTime } from './format-date.util';

describe('formatDate', () => {
  // feliz
  it('writes the date in the Brazilian order', () => {
    /* Meio-dia UTC: continua o mesmo dia em qualquer fuso do Brasil. */
    expect(formatDate('2026-09-14T12:00:00.000Z')).toBe('14/09/2026');
  });

  // triste
  it('shows a dash for an empty value', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  /* "Invalid Date" na tela é pior que nada: parece defeito do sistema, e é. */
  it('shows a dash for text that is not a date, never "Invalid Date"', () => {
    expect(formatDate('NÃO POSSUI')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('includes the time', () => {
    expect(formatDateTime('2026-09-14T12:00:00.000Z')).toMatch(/^14\/09\/2026,? \d{2}:\d{2}$/);
  });

  // triste
  it('shows a dash for text that is not a date', () => {
    expect(formatDateTime('amanhã')).toBe('—');
  });
});

describe('formatTime', () => {
  // feliz
  it('writes only hours and minutes', () => {
    expect(formatTime('2026-09-14T12:05:00.000Z')).toMatch(/^\d{2}:05$/);
  });

  // triste
  it('shows a dash for an empty value or text that is not a date', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime('ontem')).toBe('—');
  });
});

describe('formatDate for a calendar day', () => {
  // feliz
  it('keeps the same day whatever the time zone of who is looking', () => {
    expect(formatDate('2026-10-15')).toBe('15/10/2026');
  });

  // triste
  it('shows a dash for what is not a date', () => {
    expect(formatDate('2026-13-45')).toBe('—');
  });
});

describe('formatCalendarDate', () => {
  // feliz
  it('writes the day the Brazilian way without a time zone', () => {
    expect(formatCalendarDate('2026-03-15')).toBe('15/03/2026');
  });

  // triste
  it('shows a dash for what is not a calendar day', () => {
    expect(formatCalendarDate('15/03/2026')).toBe('—');
    expect(formatCalendarDate(null)).toBe('—');
  });
});
