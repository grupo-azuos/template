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

/** Ao entrar no sistema: as quatro, a urgente primeiro — o "Li e entendi" libera em 10 s. */
export const AllOnEntry: Story = {};

export const UrgentOnly: Story = { args: { data: { items: [notificationFixture('urgent')] } } };

export const ImportantOnly: Story = {
  args: { data: { items: [notificationFixture('important')] } },
};

export const NormalOnly: Story = { args: { data: { items: [notificationFixture('normal')] } } };

export const InfoOnly: Story = { args: { data: { items: [notificationFixture('info')] } } };
