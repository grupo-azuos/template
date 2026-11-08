import { describe, expect, it } from 'vitest';

import { byAttention, notificationLook, timeAgo } from './notification-style.util';

describe('notificationLook', () => {
  // feliz
  it('gives each level its own label and tone', () => {
    expect(notificationLook('urgent')).toMatchObject({ label: 'Urgente', hue: 'red' });
    expect(notificationLook('info').tone.dot).toContain('bg-hue-green');
  });
});

describe('byAttention', () => {
  // feliz
  it('puts the urgent first and, within a level, the newest', () => {
    const sorted = byAttention([
      { severity: 'normal' as const, createdAt: '2026-11-07T10:00:00Z' },
      { severity: 'urgent' as const, createdAt: '2026-11-01T10:00:00Z' },
      { severity: 'normal' as const, createdAt: '2026-11-07T12:00:00Z' },
    ]);

    expect(sorted.map((item) => `${item.severity}@${item.createdAt.slice(8, 13)}`)).toEqual([
      'urgent@01T10',
      'normal@07T12',
      'normal@07T10',
    ]);
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-11-07T12:00:00Z');

  // feliz
  it('tells the time like a person would', () => {
    expect(timeAgo('2026-11-07T11:59:40Z', now)).toBe('agora');
    expect(timeAgo('2026-11-07T11:30:00Z', now)).toBe('há 30 min');
    expect(timeAgo('2026-11-07T09:00:00Z', now)).toBe('há 3 h');
    expect(timeAgo('2026-11-06T09:00:00Z', now)).toBe('ontem');
  });

  // triste
  it('shows the date instead of a long count after a week', () => {
    expect(timeAgo('2026-10-01T12:00:00Z', now)).toBe('01/10/2026');
  });
});
