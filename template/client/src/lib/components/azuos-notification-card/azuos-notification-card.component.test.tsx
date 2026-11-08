import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NOTIFICATION_NOW, notificationFixture } from '../../utils/notification-fixture.util';
import { AzuosNotificationCard } from './azuos-notification-card.component';

describe('AzuosNotificationCard', () => {
  // feliz
  it('shows title, level, how long ago, and marks the unread one', async () => {
    const onOpen = vi.fn();
    const notification = notificationFixture('urgent');
    render(
      <AzuosNotificationCard data={{ notification, now: NOTIFICATION_NOW }} actions={{ onOpen }} />,
    );

    expect(screen.getByText('Prazo de tarefa vencido')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
    expect(screen.getByText('há 12 min')).toBeInTheDocument();
    expect(screen.getByText('Não lida')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(notification);
  });

  // feliz
  it('offers the subject action in the dialog', async () => {
    const onOpen = vi.fn();
    render(
      <AzuosNotificationCard
        data={{ notification: notificationFixture('important'), now: NOTIFICATION_NOW }}
        ui={{ variant: 'feature' }}
        actions={{ onOpen }}
      />,
    );

    expect(screen.getByText(/Importante · Pede sua atenção hoje/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Abrir as tarefas/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  // triste
  it('shows no mark on a read one, and no open button on news without a screen', () => {
    render(
      <>
        <AzuosNotificationCard
          data={{
            notification: notificationFixture('normal', { readAt: '2026-11-07T14:00:00.000Z' }),
            now: NOTIFICATION_NOW,
          }}
        />
        <AzuosNotificationCard
          data={{ notification: notificationFixture('info'), now: NOTIFICATION_NOW }}
          ui={{ variant: 'feature' }}
          actions={{ onOpen: vi.fn() }}
        />
      </>,
    );

    expect(screen.queryByText('Não lida')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Abrir/ })).not.toBeInTheDocument();
  });
});
