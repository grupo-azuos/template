import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosAppErrorBoundary } from './azuos-app-error-boundary.component';

function Bomb(): never {
  throw new Error('Falha simulada no teste');
}

describe('AzuosAppErrorBoundary', () => {
  // feliz
  it('desenha o conteúdo normalmente quando nada quebra', () => {
    render(
      <AzuosAppErrorBoundary>
        <div>Conteúdo normal</div>
      </AzuosAppErrorBoundary>,
    );

    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument();
  });

  /* Sem a boundary, um erro de render esvazia o `#root` e a tela fica em branco — sem
     mensagem, sem o que relatar. É o pior resultado possível, e é o que este teste prova
     que não acontece mais. */
  it('captura o erro de render e mostra o motivo, em vez de esvaziar a tela', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AzuosAppErrorBoundary>
        <Bomb />
      </AzuosAppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('A tela não carregou');
    expect(screen.getByText('Falha simulada no teste')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
