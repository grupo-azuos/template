import { render, screen } from '@testing-library/react';
import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AzuosZuzu, type AzuosZuzuAnim } from './azuos-zuzu.component';

function image(): HTMLImageElement {
  /* `getByRole('img')` não acha: a imagem é `aria-hidden`, e é esse o ponto do teste abaixo. */
  const found = document.querySelector('img');
  if (!found) throw new Error('o Zuzu não desenhou');

  return found;
}

/* O tween de verdade agenda quadros que o jsdom nunca pinta; o que interessa é O QUE foi pedido
   ao motor. `kill` existe porque o `useGSAP` encerra cada tween ao desmontar. */
const fakeTween = { kill: vi.fn() } as unknown as gsap.core.Tween;

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, media: '(prefers-reduced-motion: reduce)' }),
  );
}

describe('AzuosZuzu', () => {
  // feliz
  it('desenha a pose pedida', () => {
    render(<AzuosZuzu data={{ pose: 'celebrating' }} />);

    expect(image().getAttribute('src')).toContain('festejando');
  });

  it('usa o tamanho pedido, e 96 quando não pedem nenhum', () => {
    const { unmount } = render(<AzuosZuzu ui={{ size: 40 }} />);
    expect(image().width).toBe(40);
    unmount();

    render(<AzuosZuzu />);
    expect(image().width).toBe(96);
  });

  // triste
  /**
   * `alt` vazio e `aria-hidden` são de propósito: o Zuzu acompanha um texto que já diz a mesma
   * coisa, e anunciá-lo faria o leitor de tela ler "imagem do Zuzu" antes da frase que importa.
   * É regra de acessibilidade, não detalhe — por isso tem teste.
   */
  it('não se anuncia para quem usa leitor de tela', () => {
    render(<AzuosZuzu data={{ pose: 'idea' }} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(image()).toHaveAttribute('aria-hidden', 'true');
    expect(image()).toHaveAttribute('alt', '');
  });

  /* Pose desconhecida não existe no tipo, mas o padrão precisa valer quando nada é passado:
     sem pose, ele fica debruçado — e não some. */
  it('cai no debruçado quando não pedem pose', () => {
    render(<AzuosZuzu />);

    expect(image().getAttribute('src')).toContain('debrucado');
  });
});

describe('AzuosZuzu movement', () => {
  beforeEach(() => {
    stubReducedMotion(false);
    vi.spyOn(gsap, 'to').mockReturnValue(fakeTween);
    vi.spyOn(gsap, 'set').mockReturnValue(fakeTween);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // feliz
  /* Os tempos são os MESMOS do sistema atual: o mascote parado num canto o dia inteiro, pulsando
     rápido demais, vira distração — e esses valores já passaram por esse teste. */
  it.each<[AzuosZuzuAnim, Record<string, unknown>]>([
    ['sway', { rotate: 4, duration: 1.6, repeat: -1, yoyo: true }],
    ['float', { y: -8, duration: 1.5, repeat: -1, yoyo: true }],
    ['breathe', { scale: 1.03, duration: 1.8, repeat: -1, yoyo: true }],
  ])('loops the %s movement with the house timing', (anim, expected) => {
    render(<AzuosZuzu data={{ anim }} />);

    expect(gsap.to).toHaveBeenCalledWith(image(), expect.objectContaining(expected));
  });

  /* Debruçado, ele gira preso pelo alto — girar pelo centro o faria flutuar fora da borda. */
  it('pivots the sway from the top and everything else from the centre', () => {
    const { unmount } = render(<AzuosZuzu data={{ anim: 'sway' }} />);
    expect(gsap.set).toHaveBeenCalledWith(image(), { transformOrigin: 'top center' });
    unmount();

    render(<AzuosZuzu data={{ anim: 'float' }} />);
    expect(gsap.set).toHaveBeenLastCalledWith(image(), { transformOrigin: 'center center' });
  });

  it('pulses in a loop of three keyframes', () => {
    render(<AzuosZuzu data={{ anim: 'pulse' }} />);

    const vars = vi.mocked(gsap.to).mock.calls[0]?.[1] as { keyframes: unknown[]; repeat: number };
    expect(vars.keyframes).toHaveLength(3);
    expect(vars.repeat).toBe(-1);
  });

  // triste
  /* Comemoração NÃO se repete: festejar em laço algo que a pessoa já leu e resolveu vira ruído. */
  it('celebrates once and stops', () => {
    render(<AzuosZuzu data={{ anim: 'celebrate' }} />);

    const vars = vi.mocked(gsap.to).mock.calls[0]?.[1] as { keyframes: unknown[]; repeat?: number };
    expect(vars.keyframes).toHaveLength(4);
    expect(vars.repeat).toBeUndefined();
  });

  it('stays still when no movement is asked', () => {
    render(<AzuosZuzu data={{ anim: 'none' }} />);

    expect(gsap.to).not.toHaveBeenCalled();
    expect(gsap.set).not.toHaveBeenCalled();
  });

  /* Movimento reduzido no sistema operacional costuma ser enjoo ou vertigem: não vira "mais
     devagar", vira parado. */
  it('stays still when the person asked for reduced motion', () => {
    stubReducedMotion(true);

    render(<AzuosZuzu data={{ anim: 'sway' }} />);

    expect(gsap.to).not.toHaveBeenCalled();
  });
});
