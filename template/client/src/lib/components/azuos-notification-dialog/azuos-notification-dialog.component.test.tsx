import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { notificationFixture } from '../../utils/notification-fixture.util';
import {
  AzuosNotificationDialog,
  type AzuosNotificationDialogProps,
} from './azuos-notification-dialog.component';

function props(items = [notificationFixture('important'), notificationFixture('normal')]) {
  return {
    data: { items },
    state: { isOpen: true },
    actions: { onOpen: vi.fn(), onMarkRead: vi.fn(), onClose: vi.fn() },
  } satisfies AzuosNotificationDialogProps;
}

describe('AzuosNotificationDialog', () => {
  // feliz
  it('marks each one read on the step the person goes through it', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    expect(screen.getByText('Notificação 1 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText('Ana comentou numa tarefa sua')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(view.actions.onMarkRead).toHaveBeenNthCalledWith(1, [view.data.items[0]!.id]);
    expect(view.actions.onMarkRead).toHaveBeenNthCalledWith(2, [view.data.items[1]!.id]);
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // feliz
  it('takes the subject to its screen when opened', () => {
    const view = props([notificationFixture('important')]);
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(screen.getByRole('button', { name: /Abrir as tarefas/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(view.data.items[0]);
  });

  // triste
  it('marks only the front one when closing by X; the unseen one stays unread', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(view.actions.onMarkRead).toHaveBeenCalledWith([view.data.items[0]!.id]);
    expect(view.actions.onMarkRead).toHaveBeenCalledTimes(1);
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // triste
  it('draws nothing without notifications', () => {
    const { container } = render(<AzuosNotificationDialog {...props([])} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('AzuosNotificationDialog — urgent', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // triste
  it('has no Esc nor X, and "Li e entendi" waits 10 seconds', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);

    expect(screen.queryByRole('button', { name: /Close|Fechar/ })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(view.actions.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Li e entendi \(10s\)/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Abrir as tarefas/ })).not.toBeInTheDocument();
  });

  // feliz
  it('marks as read and closes on "Li e entendi" after 10 seconds', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);

    act(() => vi.advanceTimersByTime(10_500));
    fireEvent.click(screen.getByRole('button', { name: 'Li e entendi' }));

    expect(view.actions.onMarkRead).toHaveBeenCalledWith([view.data.items[0]!.id]);
    expect(view.actions.onClose).toHaveBeenCalled();
  });
});
