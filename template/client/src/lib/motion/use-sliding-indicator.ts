import gsap from 'gsap';
import { type RefObject, useLayoutEffect, useRef } from 'react';

import { cn } from '../utils/cn.util';
import { prefersReducedMotion } from './motion.util';

/**
 * O DESTAQUE QUE DESLIZA — a animação da barra do Acerola, na casca padrão dos 13 sistemas.
 *
 * Em vez de o fundo do item ativo pular de um item para o outro, um único destaque escorrega até
 * a posição e o tamanho do novo item ativo. Ele é reposicionado sempre que o atributo que marca
 * "ativo" muda dentro do container (`aria-current`, `aria-pressed`) — puro DOM, sem depender do
 * estado do componente. Quem pediu menos movimento ao sistema vê o destaque trocar de lugar na
 * hora, sem deslizar.
 */
export type SlidingIndicatorOptions = {
  /* Seletor, dentro do container, do item ativo agora. */
  selector: string;
  /* A aparência do destaque (cor, canto). Posição e tamanho vêm do item ativo. */
  indicatorClass: string;
  /* Os atributos que, ao mudar, indicam que o ativo trocou. */
  attributes: string[];
  durationSeconds?: number;
};

export const SLIDING_INDICATOR_SECONDS = 0.22;

export function useSlidingIndicator<T extends HTMLElement>(
  options: SlidingIndicatorOptions,
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const { selector, indicatorClass, durationSeconds } = options;
  const attributes = options.attributes.join(',');

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const indicator = createIndicator(indicatorClass);
    node.classList.add('relative', 'isolate');
    node.prepend(indicator);
    let tween: gsap.core.Tween | undefined;

    function snap(isAnimated: boolean) {
      tween?.kill();
      const target = targetOf(node as HTMLElement, selector);
      if (!target) {
        gsap.set(indicator, { opacity: 0 });
        return;
      }
      if (!isAnimated || prefersReducedMotion()) {
        gsap.set(indicator, target);
        return;
      }
      tween = gsap.to(indicator, {
        ...target,
        duration: durationSeconds ?? SLIDING_INDICATOR_SECONDS,
        ease: 'power2.out',
      });
    }

    snap(false);
    /* O ativo pode nascer um quadro depois (rota resolvida, fonte carregada): um re-snap cobre. */
    const frame = requestAnimationFrame(() => snap(false));
    const mutations = new MutationObserver(() => snap(true));
    mutations.observe(node, { attributes: true, subtree: true, attributeFilter: attributes.split(',') });
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => snap(false));
    resize?.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize?.disconnect();
      tween?.kill();
      indicator.remove();
    };
  }, [selector, indicatorClass, attributes, durationSeconds]);

  return ref;
}

function createIndicator(indicatorClass: string): HTMLDivElement {
  const indicator = document.createElement('div');
  indicator.setAttribute('aria-hidden', 'true');
  indicator.dataset.slot = 'sliding-indicator';
  indicator.className = cn('pointer-events-none absolute top-0 left-0 -z-10 opacity-0', indicatorClass);

  return indicator;
}

/** Onde o destaque tem de estar: a caixa do item ativo, relativa ao container. */
function targetOf(node: HTMLElement, selector: string) {
  const active = node.querySelector<HTMLElement>(selector);
  if (!active) return null;

  const box = node.getBoundingClientRect();
  const rect = active.getBoundingClientRect();

  return {
    opacity: 1,
    x: rect.left - box.left,
    y: rect.top - box.top,
    width: rect.width,
    height: rect.height,
  };
}
