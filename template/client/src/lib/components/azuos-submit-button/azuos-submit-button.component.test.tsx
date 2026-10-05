import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosSubmitButton } from './azuos-submit-button.component';

describe('AzuosSubmitButton', () => {
  // feliz
  it('submits the form it is in', () => {
    render(<AzuosSubmitButton data={{ label: 'Salvar' }} />);

    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'submit');
  });

  // triste
  /* Dois cliques seriam dois registros. */
  it('locks and swaps the label while sending', () => {
    render(
      <AzuosSubmitButton
        data={{ label: 'Salvar', loadingLabel: 'Salvando…' }}
        state={{ isLoading: true }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Salvando…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps the label when there is no loading label', () => {
    render(<AzuosSubmitButton data={{ label: 'Salvar' }} state={{ isLoading: true }} />);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
