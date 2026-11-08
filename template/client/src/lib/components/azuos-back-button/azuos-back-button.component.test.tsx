import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosBackButton } from './azuos-back-button.component';

describe('AzuosBackButton', () => {
  it('renders the default "Voltar para [destination]" text when destination is given', () => {
    render(<AzuosBackButton data={{ destination: 'empresas' }} />);

    expect(screen.getByRole('button', { name: /voltar para empresas/i })).toBeInTheDocument();
  });

  // feliz
  it('has the paralegal back look: blue text, not bold, underlined on hover', () => {
    render(<AzuosBackButton data={{ destination: 'empresas' }} />);

    const button = screen.getByRole('button', { name: /voltar para empresas/i });
    expect(button).toHaveClass('text-brand-blue-700', 'text-sm', 'gap-1', 'hover:underline');
    expect(button).not.toHaveClass('font-medium');
    expect(button.querySelector('svg')).toHaveClass('size-3.5');
  });

  it('renders a custom label when given explicitly', () => {
    render(<AzuosBackButton data={{ label: 'Retornar ao início' }} />);

    expect(screen.getByRole('button', { name: /retornar ao início/i })).toBeInTheDocument();
  });

  it('renders the "Voltar" fallback without label or destination', () => {
    render(<AzuosBackButton data={{}} />);

    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renders as an <a> link when to is given', () => {
    render(<AzuosBackButton data={{ destination: 'empresas', to: '/companies' }} />);

    const link = screen.getByRole('link', { name: /voltar para empresas/i });
    expect(link).toHaveAttribute('href', '/companies');
  });

  it('runs actions.onClick when pressed', () => {
    const handleClick = vi.fn();
    render(
      <AzuosBackButton data={{ destination: 'empresas' }} actions={{ onClick: handleClick }} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /voltar para empresas/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls window.history.back() without to or onClick', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<AzuosBackButton data={{ destination: 'empresas' }} />);

    fireEvent.click(screen.getByRole('button', { name: /voltar para empresas/i }));
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it('respects the disabled state', () => {
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

  // triste
  it('swallows the click while disabled, so the page does not go back', () => {
    const onClick = vi.fn();
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    render(
      <AzuosBackButton
        data={{ destination: 'empresas' }}
        state={{ isDisabled: true }}
        actions={{ onClick }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /voltar para empresas/i }));

    expect(onClick).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
