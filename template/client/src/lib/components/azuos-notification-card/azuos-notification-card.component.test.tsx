import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NOTIFICATION_NOW, notificationFixture } from '../../utils/notification-fixture.util';
import { AzuosNotificationCard } from './azuos-notification-card.component';

describe('AzuosNotificationCard', () => {
  // feliz
  it('mostra título, nível, há quanto tempo, e marca a não lida', async () => {
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
  it('no diálogo, oferece a ação do assunto', async () => {
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
  it('a lida não tem a marca, e a novidade sem tela não tem botão de abrir', () => {
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
