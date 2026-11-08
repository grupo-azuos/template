import { describe, expect, it } from 'vitest';

import {
  NOTIFICATION_TOPIC_KEYS,
  NOTIFICATION_TOPICS,
  notificationQuerySchema,
  markNotificationsReadSchema,
  notificationSchema,
  updateNotificationSettingsSchema,
} from './notification.schema';

const NOTIFICATION = {
  id: '0196f3e8-0000-7000-8000-00000000a001',
  topic: 'system.release',
  severity: 'info',
  title: 'Versão 1.2.0 no ar',
  body: 'O sistema foi atualizado.',
  action: { label: 'Abrir as tarefas', to: '/tasks' },
  createdAt: '2026-11-07T12:00:00.000Z',
  readAt: null,
};

describe('notificationSchema', () => {
  // feliz
  it('accepts the notification with the action leading to the subject screen', () => {
    expect(notificationSchema.parse(NOTIFICATION).action?.to).toBe('/tasks');
  });

  // triste
  it('refuses an action leaving the system and an unknown subject', () => {
    expect(
      notificationSchema.safeParse({
        ...NOTIFICATION,
        action: { label: 'x', to: 'https://fora.example' },
      }).success,
    ).toBe(false);
    expect(notificationSchema.safeParse({ ...NOTIFICATION, topic: 'outro' }).success).toBe(false);
  });
});

describe('notificationQuerySchema', () => {
  // feliz
  it('brings everything, paged, when nobody filters', () => {
    expect(notificationQuerySchema.parse({})).toMatchObject({ status: 'all', page: 1 });
  });

  // triste
  it('refuses a date that is not a date', () => {
    expect(notificationQuerySchema.safeParse({ from: '07/11/2026' }).success).toBe(false);
  });
});

describe('NOTIFICATION_TOPICS', () => {
  // feliz
  it('gives every subject a label, explanation and default level', () => {
    for (const key of NOTIFICATION_TOPIC_KEYS) {
      expect(NOTIFICATION_TOPICS[key].label.length).toBeGreaterThan(0);
      expect(['urgent', 'important', 'normal', 'info']).toContain(
        NOTIFICATION_TOPICS[key].severity,
      );
    }
  });
});

describe('updateNotificationSettingsSchema', () => {
  // feliz
  it('accepts the administrator choice per subject', () => {
    expect(
      updateNotificationSettingsSchema.parse({
        settings: [{ topic: 'system.release', isEnabled: false, severity: 'normal' }],
      }).settings,
    ).toHaveLength(1);
  });

  // triste
  it('refuses the same subject twice', () => {
    const setting = { topic: 'system.release', isEnabled: true, severity: 'normal' };

    expect(
      updateNotificationSettingsSchema.safeParse({ settings: [setting, setting] }).success,
    ).toBe(false);
  });
});

describe('markNotificationsReadSchema', () => {
  // feliz
  it('accepts the id list', () => {
    expect(markNotificationsReadSchema.parse({ ids: [NOTIFICATION.id] }).ids).toHaveLength(1);
  });

  // triste
  it('refuses an empty list and a non-uuid id', () => {
    expect(markNotificationsReadSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(markNotificationsReadSchema.safeParse({ ids: ['x'] }).success).toBe(false);
  });
});
