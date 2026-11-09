import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  countTo,
  DURATION,
  EASE,
  fadeInUp,
  highlightIn,
  popIn,
  prefersReducedMotion,
  staggerIn,
} from './motion.util';

/* O GSAP de verdade agenda quadros num `requestAnimationFrame` que o jsdom nunca dispara: o que
   interessa aqui é O QUE foi pedido ao motor, não o desenho em si. */
vi.mock('gsap', () => ({
  default: { from: vi.fn(), fromTo: vi.fn(), to: vi.fn() },
}));

type GsapVars = { onUpdate?: () => void; onComplete?: () => void; delay?: number };

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, media: '(prefers-reduced-motion: reduce)' }),
  );
}

beforeEach(() => {
  stubReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('prefersReducedMotion', () => {
  // feliz
  it('reads the operating system preference', () => {
    stubReducedMotion(true);

    expect(prefersReducedMotion()).toBe(true);
  });

  // triste
  /* Sem `matchMedia` (navegador antigo, ambiente de teste cru) a resposta é "não reduzir": a
     preferência que não dá para ler é uma preferência ausente, não uma tela sem movimento. */
  it('answers false where the preference cannot be read', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('fadeInUp and staggerIn', () => {
  // feliz
  it('fades in from below with the system duration and curve', () => {
    const target = document.createElement('div');

    fadeInUp(target, { delay: 0.1 });

    expect(gsap.from).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        opacity: 0,
        y: 12,
        duration: DURATION.base,
        ease: EASE.out,
        delay: 0.1,
      }),
    );
  });

  it('cascades a list with a small stagger and no delay by default', () => {
    const target = document.createElement('ul');

    staggerIn(target);

    expect(gsap.from).toHaveBeenCalledWith(
      target,
      expect.objectContaining({ stagger: 0.05, delay: 0 }),
    );
  });

  // triste
  /* A PESSOA MANDA MAIS QUE O DESIGN: com "reduzir movimento" ligado não é animação mais curta,
     é nenhuma. */
  it('does nothing when the person asked for reduced motion', () => {
    stubReducedMotion(true);

    fadeInUp(document.createElement('div'));
    staggerIn(document.createElement('ul'));

    expect(gsap.from).not.toHaveBeenCalled();
  });
});

describe('popIn', () => {
  // feliz
  /* `fromTo` e não `from`: o fim é escrito explicitamente em `1`, para um clique duplo que
     corte a animação no meio não deixar o ícone menor para sempre. */
  it('always ends at the natural scale', () => {
    const target = document.createElement('span');

    popIn(target);

    expect(gsap.fromTo).toHaveBeenCalledWith(
      target,
      { scale: 0.7 },
      expect.objectContaining({ scale: 1, duration: DURATION.fast }),
    );
  });

  // triste
  it('does nothing when the person asked for reduced motion', () => {
    stubReducedMotion(true);

    popIn(document.createElement('span'));

    expect(gsap.fromTo).not.toHaveBeenCalled();
  });
});

describe('highlightIn', () => {
  // feliz
  it('fades the background to the given colour and hands control back to the CSS', () => {
    const target = document.createElement('li');
    const color = 'rgb(1, 2, 3)';

    highlightIn(target, { color, delay: 0.2 });

    expect(gsap.fromTo).toHaveBeenCalledWith(
      target,
      { backgroundColor: 'transparent' },
      expect.objectContaining({
        backgroundColor: color,
        delay: 0.2,
        clearProps: 'backgroundColor',
      }),
    );
  });

  /* Sem cor explícita, a cor vem do token do tema já RESOLVIDO: o GSAP não interpola
     `var(--token)` cru. */
  it('resolves the sidebar accent token when no colour is given', () => {
    document.documentElement.style.setProperty('--sidebar-accent', ' rgb(9, 8, 7) ');
    const target = document.createElement('li');

    highlightIn(target);

    const vars = (vi.mocked(gsap.fromTo).mock.calls[0]?.[2] ?? {}) as { backgroundColor?: string };
    expect(vars.backgroundColor).toBe('rgb(9, 8, 7)');
    document.documentElement.style.removeProperty('--sidebar-accent');
  });

  // triste
  it('ignores a missing element instead of throwing', () => {
    expect(() => highlightIn(null)).not.toThrow();
    expect(gsap.fromTo).not.toHaveBeenCalled();
  });

  it('does nothing when the person asked for reduced motion', () => {
    stubReducedMotion(true);

    highlightIn(document.createElement('li'), { color: 'rgb(1, 2, 3)' });

    expect(gsap.fromTo).not.toHaveBeenCalled();
  });
});

describe('countTo', () => {
  // feliz
  it('writes the rounded partial value on every frame and the exact value at the end', () => {
    const element = document.createElement('strong');

    countTo(element, 23);

    const [counter, vars] = vi.mocked(gsap.to).mock.calls[0] as [{ current: number }, GsapVars];
    expect(vars).toMatchObject({ current: 23, duration: DURATION.count, ease: EASE.out });

    counter.current = 12.6;
    vars.onUpdate?.();
    expect(element.textContent).toBe('13');

    vars.onComplete?.();
    expect(element.textContent).toBe('23');
  });

  // triste
  /* Com movimento reduzido, o número certo aparece NA HORA — painel que mostra "13" quando são
     23 é pior que painel sem animação. */
  it('writes the final value at once under reduced motion', () => {
    stubReducedMotion(true);
    const element = document.createElement('strong');

    countTo(element, 42);

    expect(element.textContent).toBe('42');
    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('ignores a missing element instead of throwing', () => {
    expect(() => countTo(null, 5)).not.toThrow();
    expect(gsap.to).not.toHaveBeenCalled();
  });
});
