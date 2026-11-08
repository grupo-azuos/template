import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ALL_SEVERITY_NOTIFICATIONS } from '../../utils/notification-fixture.util';
import {
  AzuosNotificationBell,
  type AzuosNotificationBellProps,
} from './azuos-notification-bell.component';

function props(overrides: Partial<AzuosNotificationBellProps> = {}): AzuosNotificationBellProps {
  return {
    data: { items: ALL_SEVERITY_NOTIFICATIONS, unread: 4 },
    actions: { onOpen: vi.fn(), onMarkAllRead: vi.fn(), onOpenHistory: vi.fn() },
    ...overrides,
  };
}

describe('AzuosNotificationBell', () => {
  // feliz
  it('says how many are unread and opens the list; clicking one goes to its subject', async () => {
    const view = props();
    render(<AzuosNotificationBell {...view} />);

    await userEvent.click(screen.getByRole('button', { name: 'Notificações: 4 não lidas' }));
    await userEvent.click(screen.getByRole('button', { name: /Prazo de tarefa vencido/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(ALL_SEVERITY_NOTIFICATIONS[0]);
  });

  // feliz
  it('marks all as read and goes to the history', async () => {
    const view = props();
    render(<AzuosNotificationBell {...view} />);
    await userEvent.click(screen.getByRole('button', { name: /Notificações/ }));

    await userEvent.click(screen.getByRole('button', { name: /Marcar todas como lidas/ }));
    await userEvent.click(screen.getByRole('button', { name: /Ver o histórico/ }));

    expect(view.actions.onMarkAllRead).toHaveBeenCalled();
    expect(view.actions.onOpenHistory).toHaveBeenCalled();
  });

  // triste
  it('shows a sleeping AzuosZuzu and no badge with nothing new', async () => {
    render(<AzuosNotificationBell {...props({ data: { items: [], unread: 0 } })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Notificações' }));

    expect(screen.getByText('Nada novo por aqui.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar todas/ })).not.toBeInTheDocument();
  });

  // triste
  it('shows over 99 as 99+ and the failure in the list place', async () => {
    render(
      <AzuosNotificationBell
        {...props({ data: { items: [], unread: 575 }, state: { error: 'Falhou' } })}
      />,
    );

    expect(screen.getByText('99+')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Notificações/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });

  // feliz
  it('has a label in the one-column bar; only the icon on the rail', () => {
    const { rerender } = render(
      <AzuosNotificationBell {...props({ ui: { placement: 'sidebar' } })} />,
    );
    expect(screen.getByText('Notificações')).toBeInTheDocument();

    rerender(<AzuosNotificationBell {...props({ ui: { placement: 'rail' } })} />);
    expect(screen.queryByText('Notificações')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificações: 4 não lidas' })).toBeInTheDocument();
  });
});
