import { describe, expect, it } from 'vitest';

import { byAttention, notificationLook, timeAgo } from './notification-style.util';

describe('notificationLook', () => {
  // feliz
  it('dá a cada nível um rótulo e um tom próprios', () => {
    expect(notificationLook('urgent')).toMatchObject({ label: 'Urgente', hue: 'red' });
    expect(notificationLook('info').tone.dot).toContain('bg-hue-green');
  });
});

describe('byAttention', () => {
  // feliz
  it('põe a urgente primeiro e, no mesmo nível, a mais nova', () => {
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
  it('fala o tempo como gente', () => {
    expect(timeAgo('2026-11-07T11:59:40Z', now)).toBe('agora');
    expect(timeAgo('2026-11-07T11:30:00Z', now)).toBe('há 30 min');
    expect(timeAgo('2026-11-07T09:00:00Z', now)).toBe('há 3 h');
    expect(timeAgo('2026-11-06T09:00:00Z', now)).toBe('ontem');
  });

  // triste
  it('depois de uma semana, mostra a data em vez de uma conta longa', () => {
    expect(timeAgo('2026-10-01T12:00:00Z', now)).toBe('01/10/2026');
  });
});
