import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ALL_SEVERITY_NOTIFICATIONS } from '../../../../lib/utils/notification-fixture.util';
import {
  AzuosNotificationHistoryView,
  type AzuosNotificationHistoryViewProps,
} from './azuos-notification-history-view.component';

function props(
  overrides: Partial<AzuosNotificationHistoryViewProps> = {},
): AzuosNotificationHistoryViewProps {
  return {
    data: {
      items: ALL_SEVERITY_NOTIFICATIONS,
      filters: {
        status: 'all',
        severity: undefined,
        topic: undefined,
        search: undefined,
        from: undefined,
        to: undefined,
      },
      pagination: { page: 1, pageSize: 20, total: 4 },
    },
    state: { isLoading: false, isFetching: false, error: null, hasFilters: false },
    actions: {
      onFiltersChange: vi.fn(),
      onClearFilters: vi.fn(),
      onPageChange: vi.fn(),
      onOpen: vi.fn(),
      onMarkAllRead: vi.fn(),
    },
    ...overrides,
  };
}

describe('AzuosNotificationHistoryView', () => {
  // feliz
  it('lista o histórico e filtra pela situação e pelo texto', async () => {
    const view = props();
    render(<AzuosNotificationHistoryView {...view} />);

    expect(screen.getByText('Prazo de tarefa vencido')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Não lidas' }));
    fireEvent.change(screen.getByRole('searchbox', { name: /Buscar no título/ }), {
      target: { value: 'proposta' },
    });

    expect(view.actions.onFiltersChange).toHaveBeenCalledWith({ status: 'unread' });
    expect(view.actions.onFiltersChange).toHaveBeenCalledWith({ search: 'proposta' });
  });

  // feliz
  it('abrir uma leva ao assunto, e "Marcar todas" marca', async () => {
    const view = props();
    render(<AzuosNotificationHistoryView {...view} />);

    await userEvent.click(screen.getByRole('button', { name: /Tarefa atribuída a você/ }));
    await userEvent.click(screen.getByRole('button', { name: /Marcar todas como lidas/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(ALL_SEVERITY_NOTIFICATIONS[1]);
    expect(view.actions.onMarkAllRead).toHaveBeenCalled();
  });

  // triste
  it('recorte vazio sugere tirar filtro; falha aparece no lugar da lista', () => {
    const { rerender } = render(
      <AzuosNotificationHistoryView
        {...props({
          data: { ...props().data, items: [] },
          state: { isLoading: false, isFetching: false, error: null, hasFilters: true },
        })}
      />,
    );
    expect(screen.getByText('Nenhuma notificação neste recorte')).toBeInTheDocument();

    rerender(
      <AzuosNotificationHistoryView
        {...props({
          state: { isLoading: false, isFetching: false, error: 'Falhou', hasFilters: false },
        })}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });
});
