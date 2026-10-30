import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosErrorNotice } from './azuos-error-notice.component';

describe('AzuosErrorNotice', () => {
  /* Sem `role="alert"` a falha aparece em vermelho e passa em silêncio para quem usa leitor
     de tela — que tenta de novo sem saber que deu errado. */
  it('announces the failure to assistive technology', () => {
    render(<AzuosErrorNotice data={{ message: 'Esta ação é de Administrador.' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Esta ação é de Administrador.');
  });

  /* Aviso que se fecha é aviso que some no primeiro tropeço (CONTRIBUTING §15): quem tira a
     mensagem é a próxima tentativa dar certo. */
  it('offers no way to dismiss the message', () => {
    render(<AzuosErrorNotice data={{ message: 'Esta ação é de Administrador.' }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps a two-line message whole', () => {
    const message =
      'Não consegui falar com o servidor (502). Tente de novo em instantes — se continuar, avise quem administra o acesso.';
    render(<AzuosErrorNotice data={{ message }} />);

    expect(screen.getByRole('alert').textContent).toBe(message);
  });

  it('shows the new reason when the message changes', () => {
    const { rerender } = render(<AzuosErrorNotice data={{ message: 'Sessão expirada.' }} />);

    rerender(<AzuosErrorNotice data={{ message: 'Esta ação é de Administrador.' }} />);

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Esta ação é de Administrador.');
  });
});
