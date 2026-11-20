import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import {
  NOTIFICATION_TOPIC_KEYS,
  NOTIFICATION_TOPICS,
} from '@template/shared/schemas/notification.schema';

import { AzuosNotificationSettingsView } from './azuos-notification-settings-view.component';

const SETTINGS = NOTIFICATION_TOPIC_KEYS.map((topic) => ({
  topic,
  isEnabled: true,
  severity: NOTIFICATION_TOPICS[topic].severity,
}));

const meta = {
  title: 'Notificações/AzuosNotificationSettingsView',
  component: AzuosNotificationSettingsView,
  args: {
    data: { settings: SETTINGS },
    state: {
      canManage: true,
      isLoading: false,
      isSaving: false,
      isDirty: false,
      error: null,
      savedAt: null,
    },
    actions: { onToggle: fn(), onSeverityChange: fn(), onSave: fn(), onDiscard: fn() },
  },
} satisfies Meta<typeof AzuosNotificationSettingsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Assunto desligado: o nível fica travado até religar. */
export const Disabled: Story = {
  args: { data: { settings: SETTINGS.map((setting) => ({ ...setting, isEnabled: false })) } },
};

export const Dirty: Story = {
  args: {
    state: {
      canManage: true,
      isLoading: false,
      isSaving: false,
      isDirty: true,
      error: null,
      savedAt: null,
    },
  },
};

export const Saved: Story = {
  args: {
    state: {
      canManage: true,
      isLoading: false,
      isSaving: false,
      isDirty: false,
      error: null,
      savedAt: 1,
    },
  },
};

export const Failed: Story = {
  args: {
    state: {
      canManage: true,
      isLoading: false,
      isSaving: false,
      isDirty: true,
      error: 'Escolher o que o sistema notifica é uma ação de administrador.',
      savedAt: null,
    },
  },
};
