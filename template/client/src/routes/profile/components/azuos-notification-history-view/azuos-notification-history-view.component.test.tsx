import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ALL_SEVERITY_NOTIFICATIONS } from '../../../../lib/utils/notification-fixture.util';
import {
  AzuosNotificationHistoryView,
  type AzuosNotificationHistoryViewProps,
} from './azuos-notification-history-view.component';

const STATE = {
  isRecentLoading: false,
  isLoading: false,
  isFetching: false,
  error: null,
  hasFilters: false,
  isExpanded: false,
};

const OPEN = { ...STATE, isExpanded: true };

function props(
  overrides: Partial<AzuosNotificationHistoryViewProps> = {},
): AzuosNotificationHistoryViewProps {
  return {
    data: {
      recent: { items: ALL_SEVERITY_NOTIFICATIONS, total: 312 },
      items: ALL_SEVERITY_NOTIFICATIONS,
      filters: {
        status: 'all',
        severity: undefined,
        topic: undefined,
        search: undefined,
        from: undefined,
        to: undefined,
      },
      pagination: { page: 1, pageSize: 20, total: 312 },
    },
    state: STATE,
    actions: {
      onExpand: vi.fn(),
      onCollapse: vi.fn(),
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
  it('shows the latest ones with "Ver todas" telling how many there are', async () => {
    const view = props();
    render(<AzuosNotificationHistoryView {...view} />);

    expect(screen.getByText('Prazo de tarefa vencido')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver todas (312)' }));

    expect(view.actions.onExpand).toHaveBeenCalled();
  });

  // feliz
  it('lists everything in a dialog and filters by status and text', async () => {
    const view = props({ state: OPEN });
    render(<AzuosNotificationHistoryView {...view} />);
    const dialog = screen.getByRole('dialog', { name: 'Todas as notificações' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Não lidas' }));
    fireEvent.change(within(dialog).getByRole('searchbox', { name: /Buscar no título/ }), {
      target: { value: 'bombeiro' },
    });

    expect(view.actions.onFiltersChange).toHaveBeenCalledWith({ status: 'unread' });
    expect(view.actions.onFiltersChange).toHaveBeenCalledWith({ search: 'bombeiro' });
  });

  /* REGRESSÃO: com altura máxima, o diálogo encolhia a cada filtro que esvaziava a lista. */
  it('keeps the dialog at a fixed height, whatever the filters leave in the list', () => {
    render(<AzuosNotificationHistoryView {...props({ state: OPEN })} />);
    const dialog = screen.getByRole('dialog', { name: 'Todas as notificações' });

    expect(dialog.className).toContain('h-[min(44rem,90dvh)]');
    expect(dialog.className).not.toMatch(/\bmax-h-/);
  });

  // feliz
  it('opens the topic of a notification and marks all from the dialog', async () => {
    const view = props({ state: OPEN });
    render(<AzuosNotificationHistoryView {...view} />);
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: /Tarefa atribuída/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: /Marcar todas como lidas/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(ALL_SEVERITY_NOTIFICATIONS[1]);
    expect(view.actions.onMarkAllRead).toHaveBeenCalled();
  });

  // triste
  it('closes the dialog on Esc and goes back to the summary', () => {
    const view = props({ state: OPEN });
    render(<AzuosNotificationHistoryView {...view} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(view.actions.onCollapse).toHaveBeenCalled();
  });

  // triste
  it('offers no "Ver todas" when the latest ones are all there is', () => {
    render(
      <AzuosNotificationHistoryView
        {...props({
          data: { ...props().data, recent: { items: ALL_SEVERITY_NOTIFICATIONS, total: 4 } },
        })}
      />,
    );

    expect(screen.queryByRole('button', { name: /Ver todas/ })).not.toBeInTheDocument();
  });

  // triste
  it('suggests clearing filters on an empty scope and shows failures in place of the list', () => {
    const { rerender } = render(
      <AzuosNotificationHistoryView
        {...props({
          data: { ...props().data, items: [] },
          state: { ...OPEN, hasFilters: true },
        })}
      />,
    );
    expect(screen.getByText('Nenhuma notificação neste recorte')).toBeInTheDocument();

    rerender(<AzuosNotificationHistoryView {...props({ state: { ...OPEN, error: 'Falhou' } })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });
});
