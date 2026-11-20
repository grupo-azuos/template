import gsap from 'gsap';

import { DURATION, EASE, prefersReducedMotion } from './motion.util';

/**
 * Gira um ícone até o ângulo pedido (a seta de abrir e fechar uma seção). Quem pediu menos
 * movimento recebe o ângulo final na hora, sem o giro.
 */
export function rotateTo(target: gsap.TweenTarget, degrees: number): void {
  if (prefersReducedMotion()) {
    gsap.set(target, { rotate: degrees });

    return;
  }

  gsap.to(target, { rotate: degrees, duration: DURATION.fast, ease: EASE.out });
}
