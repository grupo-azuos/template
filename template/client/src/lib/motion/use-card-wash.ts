import gsap from 'gsap';
import { type PointerEvent as ReactPointerEvent, useCallback, useRef } from 'react';

import { effectsActions } from '../hooks/use-effects/use-effects';
import { prefersReducedMotion } from './motion.util';

/**
 * O hover dos cards: uma mancha que entra em círculo a partir de onde o mouse entrou e cobre o
 * card, e recolhe em direção a onde ele saiu. Animado com GSAP, só em `transform` (a placa de
 * vídeo cuida), e só o card sob o mouse anima.
 *
 * Quem pediu menos movimento ao sistema vê a mancha aparecer e sumir, sem crescer.
 */

/** Diâmetro-base da mancha, em pixels; o GSAP escala a partir dele. */
export const WASH_SIZE = 10;

const GROW_SECONDS = 0.5;
const SHRINK_SECONDS = 0.35;

type Point = { x: number; y: number; scale: number };

/** Onde o mouse está dentro do card, e quanto a mancha precisa crescer para cobri-lo inteiro. */
function pointOf(event: ReactPointerEvent<HTMLElement>): Point {
  const box = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  const reach = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));

  return { x, y, scale: (reach * 2) / WASH_SIZE + 1 };
}

export function useCardWash() {
  const washRef = useRef<HTMLSpanElement>(null);

  const onPointerEnter = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const wash = washRef.current;
    if (!wash) return;

    const point = pointOf(event);
    gsap.killTweensOf(wash);
    gsap.set(wash, { left: point.x, top: point.y });
    if (prefersReducedMotion()) {
      gsap.set(wash, { scale: point.scale });
      return;
    }

    effectsActions.onAnimationStart(GROW_SECONDS * 1000);
    gsap.fromTo(
      wash,
      { scale: 0 },
      { scale: point.scale, duration: GROW_SECONDS, ease: 'power2.out' },
    );
  }, []);

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const wash = washRef.current;
    if (!wash) return;

    const point = pointOf(event);
    gsap.killTweensOf(wash);
    if (prefersReducedMotion()) {
      gsap.set(wash, { scale: 0 });
      return;
    }

    gsap.to(wash, {
      left: point.x,
      top: point.y,
      scale: 0,
      duration: SHRINK_SECONDS,
      ease: 'power2.in',
    });
  }, []);

  return { washRef, handlers: { onPointerEnter, onPointerLeave } };
}
