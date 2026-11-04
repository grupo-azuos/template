import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AzuosToaster, TOAST_DURATION_MS } from './azuos-toaster.component';

describe('AzuosToaster', () => {
  afterEach(() => {
    act(() => toast.dismiss());
  });

  // feliz
  it('shows the notice asked from anywhere in the app', async () => {
    render(<AzuosToaster />);

    act(() => {
      toast('Decisão registrada.');
    });

    expect(await screen.findByText('Decisão registrada.')).toBeInTheDocument();
  });

  it('stays on screen for 5 seconds and then leaves on its own', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<AzuosToaster />);
    act(() => {
      toast('Reunião iniciada.');
    });
    expect(await screen.findByText('Reunião iniciada.')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1000));
    expect(screen.getByText('Reunião iniciada.')).toBeInTheDocument();

    /* Passado o tempo, o Sonner ainda anima a saída antes de tirar o aviso da tela. */
    act(() => vi.advanceTimersByTime(2000));
    await expect.poll(() => screen.queryByText('Reunião iniciada.')).toBeNull();
    vi.useRealTimers();
  });

  it('closes on the X, before the time is up', async () => {
    render(<AzuosToaster />);
    act(() => {
      toast('Reunião aberta.');
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Fechar aviso' }));

    await expect.poll(() => screen.queryByText('Reunião aberta.')).toBeNull();
  });

  // triste
  it('shows a failure as an error notice', async () => {
    render(<AzuosToaster />);

    act(() => {
      toast.error('Não foi possível salvar.');
    });

    const notice = await screen.findByText('Não foi possível salvar.');
    expect(notice.closest('[data-sonner-toast]')).toHaveAttribute('data-type', 'error');
  });
});
