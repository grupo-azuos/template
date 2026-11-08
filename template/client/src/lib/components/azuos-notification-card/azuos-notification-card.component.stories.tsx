import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import {
  ALL_SEVERITY_NOTIFICATIONS,
  NOTIFICATION_NOW,
  notificationFixture,
} from '../../utils/notification-fixture.util';
import { AzuosNotificationCard } from './azuos-notification-card.component';

const meta = {
  title: 'Notificações/AzuosNotificationCard',
  component: AzuosNotificationCard,
  args: {
    data: { notification: notificationFixture('normal'), now: NOTIFICATION_NOW },
    ui: { className: 'w-96' },
    actions: { onOpen: fn() },
  },
} satisfies Meta<typeof AzuosNotificationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A linha do sininho e do histórico. */
export const Compact: Story = {};

/** Os quatro níveis, lado a lado — é por aqui que se valida a cara de cada um. */
export const AllSeverities: Story = {
  render: (args) => (
    <ul className="flex w-96 flex-col gap-1">
      {ALL_SEVERITY_NOTIFICATIONS.map((notification) => (
        <li key={notification.id}>
          <AzuosNotificationCard {...args} data={{ notification, now: NOTIFICATION_NOW }} />
        </li>
      ))}
    </ul>
  ),
};

export const Read: Story = {
  args: {
    data: {
      notification: notificationFixture('important', { readAt: '2026-11-07T14:20:00.000Z' }),
      now: NOTIFICATION_NOW,
    },
  },
};

/** O miolo do diálogo de entrada. */
export const FeatureImportant: Story = {
  args: {
    data: { notification: notificationFixture('important'), now: NOTIFICATION_NOW },
    ui: { variant: 'feature', className: 'w-[28rem]' },
  },
};

export const FeatureInfo: Story = {
  args: {
    data: { notification: notificationFixture('info'), now: NOTIFICATION_NOW },
    ui: { variant: 'feature', className: 'w-[28rem]' },
  },
};

/** Caso limite: título e texto compridos não podem empurrar a hora para fora. */
export const LongText: Story = {
  args: {
    data: {
      notification: notificationFixture('normal', {
        title:
          'Ana Ferreira de Albuquerque comentou numa tarefa sua sobre a Empresa Exemplo Comércio de Materiais de Construção Ltda',
        body: 'Proposta enviada ao cliente, aguardando a resposta do financeiro, que prometeu para a semana que vem, mas pode atrasar por causa do feriado.',
      }),
      now: NOTIFICATION_NOW,
    },
  },
};
