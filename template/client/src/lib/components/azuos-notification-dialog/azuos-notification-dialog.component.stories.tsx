import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import {
  ALL_SEVERITY_NOTIFICATIONS,
  notificationFixture,
} from '../../utils/notification-fixture.util';
import { AzuosNotificationDialog } from './azuos-notification-dialog.component';

const meta = {
  title: 'Notificações/AzuosNotificationDialog',
  component: AzuosNotificationDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    data: { items: ALL_SEVERITY_NOTIFICATIONS },
    state: { isOpen: true },
    actions: { onOpen: fn(), onMarkRead: fn(), onClose: fn() },
  },
} satisfies Meta<typeof AzuosNotificationDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Ao entrar no sistema: as quatro numa lista só, a urgente primeiro, em vermelho — o "Li e
    entendi" libera em 10 s. */
export const AllOnEntry: Story = {};

/** Sem urgente: a lista com "Li todas", e o X e o Esc também marcam todas. */
export const WithoutUrgent: Story = {
  args: {
    data: {
      items: [
        notificationFixture('important'),
        notificationFixture('normal'),
        notificationFixture('info'),
      ],
    },
  },
};

export const UrgentOnly: Story = { args: { data: { items: [notificationFixture('urgent')] } } };

export const ImportantOnly: Story = {
  args: { data: { items: [notificationFixture('important')] } },
};

export const NormalOnly: Story = { args: { data: { items: [notificationFixture('normal')] } } };

export const InfoOnly: Story = { args: { data: { items: [notificationFixture('info')] } } };
