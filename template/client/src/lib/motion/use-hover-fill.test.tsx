import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fillColorOf, useHoverFill, type FillTone } from './use-hover-fill';

function Probe({ tone }: { tone?: FillTone }) {
  const fill = useHoverFill(tone);

  return (
    <div data-testid="item" className="hover-fill" style={fill.style} {...fill.handlers}>
      um item
    </div>
  );
}

describe('fillColorOf', () => {
  // feliz
  /* O tom SUAVE, e não a cor cheia: o texto do item continua por cima e tem de seguir legível. */
  it('gives the soft token of the tone', () => {
    expect(fillColorOf('success')).toBe('var(--success-soft)');
    expect(fillColorOf('danger')).toBe('var(--destructive-soft)');
  });

  // triste
  it('falls back to neutral for no tone', () => {
    expect(fillColorOf(undefined)).toBe('var(--muted)');
    expect(fillColorOf(null)).toBe('var(--muted)');
  });
});

describe('useHoverFill', () => {
  // feliz
  it('declares the fill colour as a CSS variable on the element', () => {
    render(<Probe tone="info" />);

    expect(screen.getByTestId('item').style.getPropertyValue('--fill-color')).toBe(
      'var(--info-soft)',
    );
  });

  /* O CSS sabe crescer o círculo; o que ele não sabe é POR ONDE o mouse entrou. Sem estas duas
     variáveis, o preenchimento nasceria sempre no centro, e o efeito deixaria de explicar nada. */
  it('writes where the pointer came in', () => {
    render(<Probe />);
    const item = screen.getByTestId('item');

    fireEvent.pointerEnter(item, { clientX: 12, clientY: 8 });

    expect(item.style.getPropertyValue('--fill-x')).toBe('12px');
    expect(item.style.getPropertyValue('--fill-y')).toBe('8px');
  });

  it('measures how far the circle has to grow to cover the item', () => {
    render(<Probe />);
    const item = screen.getByTestId('item');

    fireEvent.pointerEnter(item, { clientX: 0, clientY: 0 });

    expect(item.style.getPropertyValue('--fill-reach')).toMatch(/^\d+px$/);
  });

  // triste
  /* Ao SAIR o círculo encolhe em direção ao ponto de saída: sem anotar a saída, ele encolheria de
     volta ao ponto de entrada, e o movimento ficaria ao contrário do gesto. */
  it('writes where the pointer left, so the circle shrinks the right way', () => {
    render(<Probe />);
    const item = screen.getByTestId('item');

    fireEvent.pointerEnter(item, { clientX: 2, clientY: 2 });
    fireEvent.pointerLeave(item, { clientX: 30, clientY: 20 });

    expect(item.style.getPropertyValue('--fill-x')).toBe('30px');
    expect(item.style.getPropertyValue('--fill-y')).toBe('20px');
  });
});
