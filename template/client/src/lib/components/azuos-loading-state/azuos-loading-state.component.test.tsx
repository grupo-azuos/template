import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosLoadingState } from './azuos-loading-state.component';

describe('AzuosLoadingState', () => {
  /* Numa tela com lista e painel, "carregando" sem dizer O QUÊ deixa a pessoa sem saber se foi
     a lista que falhou ou se ainda vem. */
  it('announces what is loading', () => {
    render(<AzuosLoadingState data={{ label: 'Carregando usuários…' }} />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando usuários…');
  });

  /* `polite`, e não `assertive`: a espera não pode interromper a leitura do que já está na
     tela. */
  it('waits for a pause before announcing', () => {
    render(<AzuosLoadingState data={{ label: 'Carregando usuários…' }} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('keeps the spinner out of what is announced', () => {
    render(<AzuosLoadingState data={{ label: 'Carregando usuários…' }} />);

    const status = screen.getByRole('status');

    expect(status.textContent).toBe('Carregando usuários…');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a long label whole', () => {
    const label = 'Conferindo a sua sessão antes de abrir a administração…';
    render(<AzuosLoadingState data={{ label }} />);

    expect(screen.getByRole('status').textContent).toBe(label);
  });
});
