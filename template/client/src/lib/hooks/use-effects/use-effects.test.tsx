import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { detectLevel, effectsActions, useEffects } from './use-effects';

function Probe() {
  const effects = useEffects();

  return (
    <button type="button" onClick={effects.actions.onToggle}>
      {effects.level}
    </button>
  );
}

describe('detectLevel', () => {
  // feliz
  /* Na dúvida é `full`: a medição corrige depois, se precisar. Começar no leve numa máquina boa
     entrega menos do que ela aguenta, e ninguém percebe que havia mais. */
  it('answers one of the two levels', () => {
    expect(['full', 'lite']).toContain(detectLevel());
  });
});

describe('useEffects', () => {
  // feliz
  it('writes the level on the html element, which is what the CSS reads', () => {
    render(<Probe />);

    expect(document.documentElement.getAttribute('data-effects')).toMatch(/^(full|lite)$/);
  });

  it('lets the person override what the system guessed', () => {
    render(<Probe />);
    const button = screen.getByRole('button');
    const before = button.textContent;

    act(() => button.click());

    expect(button.textContent).not.toBe(before);
    expect(document.documentElement.getAttribute('data-effects')).toBe(button.textContent);
  });

  // triste
  /* Quem já escolheu no botão NÃO é contrariado pela medição: a máquina pode engasgar, mas a escolha
     da pessoa continua valendo — do contrário o modo completo que ela ligou cairia sozinho e
     pareceria que o botão não funciona. */
  it('does not let a slow measurement override the person choice', () => {
    render(<Probe />);
    act(() => screen.getByRole('button').click());
    const chosen = screen.getByRole('button').textContent;

    act(() => {
      effectsActions.onFrameRateMeasured(5);
      effectsActions.onFrameRateMeasured(5);
    });

    expect(screen.getByRole('button').textContent).toBe(chosen);
  });
});
