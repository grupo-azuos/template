import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosErrorState } from './azuos-error-state.component';

describe('AzuosErrorState', () => {
  // feliz
  it('announces the reason as an alert', () => {
    render(<AzuosErrorState data={{ message: 'O banco está ocupado.' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('O banco está ocupado.');
  });

  it('retries when the button is clicked', async () => {
    const onRetry = vi.fn();
    render(<AzuosErrorState data={{ message: 'Falhou' }} actions={{ onRetry }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  // triste
  /* Um botão que não resolve nada ensina a pessoa a ignorá-lo. */
  it('offers no retry button when there is nothing to retry', () => {
    render(<AzuosErrorState data={{ message: 'Seu perfil é somente leitura.' }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('locks the retry button while retrying', () => {
    render(
      <AzuosErrorState
        data={{ message: 'Falhou' }}
        state={{ isRetrying: true }}
        actions={{ onRetry: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeDisabled();
  });
});
