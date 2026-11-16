import { afterEach, describe, expect, it, vi } from 'vitest';

import { isEntryDue, markEntrySeen, todayInBrasilia } from './notification-entry.util';

const USER = '00000000-0000-8000-8000-000000000001';
const OTHER = '00000000-0000-8000-8000-000000000002';

function clearMarks() {
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
  localStorage.clear();
}

afterEach(() => {
  clearMarks();
  vi.restoreAllMocks();
});

describe('todayInBrasilia', () => {
  // feliz
  it('turns the day at midnight in Brasília, not in UTC', () => {
    expect(todayInBrasilia(new Date('2026-11-16T02:30:00.000Z'))).toBe('2026-11-15');
    expect(todayInBrasilia(new Date('2026-11-16T03:30:00.000Z'))).toBe('2026-11-16');
  });
});

describe('isEntryDue', () => {
  // feliz
  it('is due on the first access, and not again in the same session and day', () => {
    expect(isEntryDue(USER, '2026-11-16')).toBe(true);

    markEntrySeen(USER, '2026-11-16');

    expect(isEntryDue(USER, '2026-11-16')).toBe(false);
    expect(isEntryDue(OTHER, '2026-11-16')).toBe(true);
  });

  // feliz
  it('is due again on the next day, even in the same session', () => {
    markEntrySeen(USER, '2026-11-16');

    expect(isEntryDue(USER, '2026-11-17')).toBe(true);
  });

  // triste
  it('is due again in a new browser session, even on the same day', () => {
    markEntrySeen(USER, '2026-11-16');
    document.cookie = `azuos-notification-entry-${USER}=; path=/; max-age=0`;

    expect(isEntryDue(USER, '2026-11-16')).toBe(true);
  });

  // triste
  it('stays due when the browser blocks the storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => markEntrySeen(USER, '2026-11-16')).not.toThrow();
    expect(isEntryDue(USER, '2026-11-16')).toBe(true);
  });
});
