import { describe, expect, it } from 'vitest';

import { toNotification, toSettings } from './notifications.mapper';

describe('toNotification', () => {
  // feliz
  it('publishes the action only with a label and a target', () => {
    const base = {
      id: '0196f3e8-0000-7000-8000-00000000a001',
      recipientId: 'r',
      topic: 'system.release',
      severity: 'normal' as const,
      title: 't',
      body: 'b',
      dedupeKey: 'k',
      createdAt: new Date('2026-11-07T12:00:00.000Z'),
      readAt: null,
    };

    expect(toNotification({ ...base, actionLabel: 'Abrir', actionTo: '/x' }).action).toEqual({
      label: 'Abrir',
      to: '/x',
    });
    // triste
    expect(toNotification({ ...base, actionLabel: null, actionTo: '/x' }).action).toBeNull();
  });
});

describe('toSettings', () => {
  // triste
  it('ignores a stored subject that left the contract, using defaults where untouched', () => {
    const settings = toSettings([
      {
        topic: 'assunto.antigo',
        isEnabled: false,
        severity: 'info',
        updatedAt: new Date(),
        updatedBy: null,
      },
    ]);

    expect(settings.map((item) => item.topic)).not.toContain('assunto.antigo');
    expect(settings.every((item) => item.isEnabled)).toBe(true);
  });
});
