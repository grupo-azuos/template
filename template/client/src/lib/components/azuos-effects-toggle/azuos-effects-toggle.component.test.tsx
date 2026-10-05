import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AzuosEffectsToggle } from './azuos-effects-toggle.component';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-effects');
});

describe('AzuosEffectsToggle', () => {
  // feliz
  it('says which mode is in use and what the click will do', () => {
    render(<AzuosEffectsToggle />);

    expect(screen.getByRole('button')).toHaveAccessibleName(/Efeitos visuais/);
  });

  it('writes the chosen level on the html element, which is what the CSS reads', async () => {
    render(<AzuosEffectsToggle />);
    const before = screen.getByRole('button').getAttribute('aria-label');

    await userEvent.click(screen.getByRole('button'));

    expect(document.documentElement.getAttribute('data-effects')).toMatch(/^(full|lite)$/);
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toBe(before);
  });

  it('comes back to the first mode on a second click', async () => {
    render(<AzuosEffectsToggle />);
    const before = screen.getByRole('button').getAttribute('aria-label');

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(before);
  });

  // triste
  /* Só ícone: sem o rótulo acessível, quem usa leitor de tela encontra um botão sem nome. */
  it('keeps an accessible name even showing only the icon', () => {
    render(<AzuosEffectsToggle />);

    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleName();
    expect(button.textContent).toBe('');
  });
});
