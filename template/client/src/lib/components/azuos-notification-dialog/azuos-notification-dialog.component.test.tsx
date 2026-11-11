import { act, fireEvent, render, screen, within } from '@testing-library/react';
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

const idsOf = (view: ReturnType<typeof props>) => view.data.items.map((item) => item.id);

describe('AzuosNotificationDialog', () => {
  // feliz
  it('shows every one at once, in a single list, with no steps', () => {
    render(<AzuosNotificationDialog {...props()} />);

    expect(screen.getByRole('heading', { name: 'Você tem 2 notificações' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para Importantes (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para Avisos (1)' })).toBeInTheDocument();
    expect(screen.getByText('Ana comentou numa tarefa sua')).toBeInTheDocument();
    const rows = screen
      .getAllByRole('region')
      .flatMap((group) => within(group).getAllByRole('listitem'));
    expect(rows).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Próxima' })).not.toBeInTheDocument();
  });

  // triste
  /* REGRESSÃO: ao abrir, o primeiro card ganhava o foco e o anel aceso, cortado pela lista. */
  it('opens with the focus on the way out, not on a card', () => {
    render(<AzuosNotificationDialog {...props()} />);

    expect(screen.getByRole('button', { name: 'Li todas' })).toHaveFocus();
  });

  // feliz
  it('marks all of them read on "Li todas"', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(screen.getByRole('button', { name: 'Li todas' }));

    expect(view.actions.onMarkRead).toHaveBeenCalledWith(idsOf(view));
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // feliz
  it('opens the topic screen from a row', () => {
    const view = props([notificationFixture('normal')]);
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(screen.getByRole('button', { name: /Ana comentou numa tarefa sua/ }));

    expect(view.actions.onOpen).toHaveBeenCalledWith(view.data.items[0]);
  });

  // triste
  it('marks all of them read when closed by Esc, since all were on screen', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(view.actions.onMarkRead).toHaveBeenCalledWith(idsOf(view));
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // triste
  it('marks all of them read when closed by the X on the hero', () => {
    const view = props();
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(view.actions.onMarkRead).toHaveBeenCalledWith(idsOf(view));
  });

  // triste
  it('renders nothing without a notification', () => {
    const { container } = render(<AzuosNotificationDialog {...props([])} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('AzuosNotificationDialog — urgent', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // feliz
  it('groups by level with the urgent ones first, whatever order they came in', () => {
    render(
      <AzuosNotificationDialog
        {...props([
          notificationFixture('normal'),
          notificationFixture('urgent'),
          notificationFixture('important'),
        ])}
      />,
    );

    const groups = screen.getAllByRole('region');
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      'Urgentes',
      'Importantes',
      'Avisos',
    ]);
    expect(within(groups[0]!).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Ir para Urgentes (1)' })).toBeInTheDocument();
  });

  // feliz
  /* O `scrollIntoView` rolava também a janela do diálogo, e o hero sumia. Só a lista rola. */
  it('takes the scoreboard click to its group, scrolling only the list', () => {
    const scrollTo = vi.fn();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <AzuosNotificationDialog
        {...props([notificationFixture('urgent'), notificationFixture('normal')])}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ir para Avisos (1)' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number), behavior: 'smooth' });
    expect(scrollTo.mock.contexts[0]).toBe(
      screen.getByRole('region', { name: 'Avisos' }).parentElement,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  // triste
  it('has no Esc nor X, and "Li e entendi" waits 10 seconds', () => {
    const view = props([notificationFixture('urgent'), notificationFixture('normal')]);
    render(<AzuosNotificationDialog {...view} />);

    expect(screen.queryByRole('button', { name: /Close|Fechar/ })).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(view.actions.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Li e entendi' })).toBeDisabled();
    /* Os segundos ficam escritos em cima da barra, e não no botão. */
    expect(screen.getByText('10 s')).toBeInTheDocument();
    expect(screen.getByText('Leia antes de confirmar')).toBeInTheDocument();
  });

  // triste
  /* Clicar fora ou apertar Esc com urgente não fecha, e não fica mudo: pede o "Li e entendi". */
  it('points at "Li e entendi" with a tooltip when someone tries to leave with an urgent one', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.getByRole('tooltip')).toHaveTextContent('libera em 10 s');
    expect(screen.getByRole('status')).toHaveTextContent('libera em 10 s');
    expect(screen.getByRole('dialog')).toHaveClass('motion-safe:animate-nudge');
    expect(view.actions.onClose).not.toHaveBeenCalled();
  });

  // feliz
  it('stops shaking at once, and closes the tooltip a few seconds later', () => {
    render(<AzuosNotificationDialog {...props([notificationFixture('urgent')])} />);

    act(() => vi.advanceTimersByTime(10_500));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Para continuar, clique em “Li e entendi”.',
    );

    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByRole('dialog')).not.toHaveClass('motion-safe:animate-nudge');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3_000));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // feliz
  it('counts the seconds down above the bar, and says when it is ready', () => {
    render(<AzuosNotificationDialog {...props([notificationFixture('urgent')])} />);

    act(() => vi.advanceTimersByTime(3_100));
    expect(screen.getByText('7 s')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(7_500));
    expect(screen.getByText('Pode confirmar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Li e entendi' })).toBeEnabled();
  });

  // feliz
  it('marks all of them read and closes on "Li e entendi" after 10 seconds', () => {
    const view = props([notificationFixture('urgent'), notificationFixture('normal')]);
    render(<AzuosNotificationDialog {...view} />);

    act(() => vi.advanceTimersByTime(10_500));
    fireEvent.click(screen.getByRole('button', { name: 'Li e entendi' }));

    expect(view.actions.onMarkRead).toHaveBeenCalledWith(idsOf(view));
    expect(view.actions.onClose).toHaveBeenCalled();
  });

  // triste
  it('does not leave for another screen from an urgent row', () => {
    const view = props([notificationFixture('urgent')]);
    render(<AzuosNotificationDialog {...view} />);

    fireEvent.click(
      within(screen.getByRole('region', { name: 'Urgentes' })).getByRole('button', {
        name: /Prazo de tarefa vencido/,
      }),
    );

    expect(view.actions.onOpen).not.toHaveBeenCalled();
  });
});
