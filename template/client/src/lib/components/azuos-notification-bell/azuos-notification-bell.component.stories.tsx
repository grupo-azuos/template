import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { ALL_SEVERITY_NOTIFICATIONS } from '../../utils/notification-fixture.util';
import { AzuosNotificationBell } from './azuos-notification-bell.component';

const meta = {
  title: 'Notificações/AzuosNotificationBell',
  component: AzuosNotificationBell,
  parameters: { layout: 'centered' },
  args: {
    data: { items: ALL_SEVERITY_NOTIFICATIONS, unread: 4 },
    actions: { onOpen: fn(), onMarkAllRead: fn(), onOpenHistory: fn() },
  },
} satisfies Meta<typeof AzuosNotificationBell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clique no sininho para abrir a lista. */
export const WithUnread: Story = {};

/** No trilho do app-shell, logo acima da foto do perfil: só o ícone, e a lista abre ao lado. */
export const InRail: Story = {
  args: { ui: { placement: 'rail' } },
  render: (args) => (
    <div className="rounded-box bg-sidebar flex flex-col items-center gap-1 p-2">
      <AzuosNotificationBell {...args} />
    </div>
  ),
};

/** Na barra de uma coluna: ícone, rótulo e o número. */
export const InSidebar: Story = {
  args: { ui: { placement: 'sidebar' } },
  render: (args) => (
    <div className="rounded-box bg-sidebar w-64 p-2">
      <AzuosNotificationBell {...args} />
    </div>
  ),
};

export const Empty: Story = { args: { data: { items: [], unread: 0 } } };

/** Caso limite: mais de 99 vira "99+", e o selo não empurra nada. */
export const ManyUnread: Story = {
  args: { data: { items: ALL_SEVERITY_NOTIFICATIONS, unread: 575 } },
};

export const Failed: Story = {
  args: { state: { error: 'Não consegui ler as notificações agora.' } },
};
