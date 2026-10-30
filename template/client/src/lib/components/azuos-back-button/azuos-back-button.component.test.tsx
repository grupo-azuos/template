import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosBackButton } from './azuos-back-button.component';

describe('AzuosBackButton', () => {
  it('renderiza com texto padrão "Voltar para [destination]" quando destination é informado', () => {
    render(<AzuosBackButton data={{ destination: 'empresas' }} />);

    expect(screen.getByRole('button', { name: /voltar para empresas/i })).toBeInTheDocument();
  });

  it('renderiza com label customizado quando fornecido explicitamente', () => {
    render(<AzuosBackButton data={{ label: 'Retornar ao início' }} />);

    expect(screen.getByRole('button', { name: /retornar ao início/i })).toBeInTheDocument();
  });

  it('renderiza fallback "Voltar" quando nem label nem destination são fornecidos', () => {
    render(<AzuosBackButton data={{}} />);

    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renderiza como link <a> quando to é informado', () => {
    render(<AzuosBackButton data={{ destination: 'empresas', to: '/companies' }} />);

    const link = screen.getByRole('link', { name: /voltar para empresas/i });
    expect(link).toHaveAttribute('href', '/companies');
  });

  it('executa actions.onClick quando acionado', () => {
    const handleClick = vi.fn();
    render(<AzuosBackButton data={{ destination: 'empresas' }} actions={{ onClick: handleClick }} />);

    fireEvent.click(screen.getByRole('button', { name: /voltar para empresas/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('chama window.history.back() quando nenhum to nem onClick são fornecidos', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<AzuosBackButton data={{ destination: 'empresas' }} />);

    fireEvent.click(screen.getByRole('button', { name: /voltar para empresas/i }));
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it('respeita estado desabilitado (disabled)', () => {
    const handleClick = vi.fn();
    render(
      <AzuosBackButton
        data={{ destination: 'empresas' }}
        state={{ isDisabled: true }}
        actions={{ onClick: handleClick }}
      />,
    );

    const button = screen.getByRole('button', { name: /voltar para empresas/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
