import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTheme } from './theme';

function Probe() {
  const { theme, actions } = useTheme();

  return (
    <button type="button" onClick={actions.onToggle}>
      {theme}
    </button>
  );
}

/**
 * O tema vive no escopo do módulo — uma preferência do sistema inteiro, não de uma tela. Estes testes
 * não presumem em qual tema a suíte começou: cada um lê o estado de ANTES e verifica a mudança.
 */
describe('useTheme', () => {
  // feliz
  it('reports one of the two themes', () => {
    render(<Probe />);

    expect(screen.getByRole('button').textContent).toMatch(/^(light|dark)$/);
  });

  /* O atributo no `<html>` é o que o CSS lê (`lib/theme/tokens.css`): sem escrevê-lo, a troca
     aconteceria no estado do React e a tela continuaria da mesma cor. */
  it('writes the theme on the html element, which is what the CSS reads', () => {
    render(<Probe />);

    act(() => screen.getByRole('button').click());

    expect(document.documentElement.getAttribute('data-theme')).toBe(
      screen.getByRole('button').textContent,
    );
  });

  it('is the same theme for every screen at once', () => {
    render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    const [first, second] = screen.getAllByRole('button');

    act(() => first?.click());

    expect(second?.textContent).toBe(first?.textContent);
  });

  // triste
  it('comes back to the first theme on a second toggle', () => {
    render(<Probe />);
    const button = screen.getByRole('button');
    const before = button.textContent;

    act(() => button.click());
    act(() => button.click());

    expect(button.textContent).toBe(before);
  });
});
