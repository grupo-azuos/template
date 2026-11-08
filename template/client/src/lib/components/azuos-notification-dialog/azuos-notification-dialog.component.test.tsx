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
  it('grava cada uma como lida no passo em que a pessoa passa por ela', () => {
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
  it('abrir o assunto leva à tela dele', () => {
    const view = props([notificationFixture('important')]);
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(screen.getByRole('button', { name: /Abrir as tarefas/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(view.data.items[0]);
  });

  // triste
  it('fechar pelo X grava só a que estava na frente; a que ela não viu continua não lida', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(view.actions.onMarkRead).toHaveBeenCalledWith([view.data.items[0]!.id]);
    expect(view.actions.onMarkRead).toHaveBeenCalledTimes(1);
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // triste
  it('sem notificação, não desenha nada', () => {
    const { container } = render(<AzuosNotificationDialog {...props([])} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('AzuosNotificationDialog — urgente', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // triste
  it('não fecha por Esc nem tem X, e o "Li e entendi" espera 10 segundos', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);

    expect(screen.queryByRole('button', { name: /Close|Fechar/ })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(view.actions.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Li e entendi \(10s\)/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Abrir as tarefas/ })).not.toBeInTheDocument();
  });

  // feliz
  it('depois de 10 segundos, "Li e entendi" marca lida e fecha', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);

    act(() => vi.advanceTimersByTime(10_500));
    fireEvent.click(screen.getByRole('button', { name: 'Li e entendi' }));

    expect(view.actions.onMarkRead).toHaveBeenCalledWith([view.data.items[0]!.id]);
    expect(view.actions.onClose).toHaveBeenCalled();
  });
});
