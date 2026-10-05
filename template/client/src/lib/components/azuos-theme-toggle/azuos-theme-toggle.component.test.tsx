import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AzuosThemeToggle } from './azuos-theme-toggle.component';

/**
 * O tema é uma preferência do SISTEMA, e o estado dela vive no escopo do módulo — de propósito, para
 * duas telas não terem cada uma a sua cópia. O efeito colateral aqui é que limpar o `localStorage`
 * entre os testes não o zera: o módulo já leu o valor na importação.
 *
 * Então estes testes não presumem em qual tema a suíte começou. Cada um lê o estado de ANTES e
 * verifica a mudança — que é o que o componente promete, e o que continua valendo em qualquer ordem.
 */
const labelOf = () => screen.getByRole('button').getAttribute('aria-label');

describe('AzuosThemeToggle', () => {
  // feliz
  it('names the button after the theme the click will bring', () => {
    render(<AzuosThemeToggle />);

    expect(labelOf()).toMatch(/^Mudar para o tema (claro|escuro)$/);
  });

  it('writes the chosen theme on the html element, which is what the CSS reads', async () => {
    render(<AzuosThemeToggle />);
    const wantsDark = labelOf() === 'Mudar para o tema escuro';

    await userEvent.click(screen.getByRole('button'));

    expect(document.documentElement).toHaveAttribute('data-theme', wantsDark ? 'dark' : 'light');
  });

  it('comes back to the first theme on a second click', async () => {
    render(<AzuosThemeToggle />);
    const before = document.documentElement.getAttribute('data-theme');

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));

    expect(document.documentElement.getAttribute('data-theme')).toBe(before);
  });

  it('remembers the choice, because it is a preference of the whole system', async () => {
    render(<AzuosThemeToggle />);

    await userEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem('azuos-theme')).toMatch(/^(light|dark)$/);
  });

  // triste
  /* O botão é só de ícone: sem o rótulo acessível, quem usa leitor de tela encontra um botão sem
     nome — e um botão sem nome não é um botão, é um obstáculo. */
  it('keeps an accessible name even showing only the icon', () => {
    render(<AzuosThemeToggle />);

    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleName();
    expect(button.textContent).toBe('');
  });
});
