import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useRef } from 'react';

import { DURATION, EASE, prefersReducedMotion } from '../../motion/motion.util';

gsap.registerPlugin(Flip);

/**
 * "Auto-animate" de verdade: mede a altura de UM elemento antes de algo mudar dentro dele e
 * anima a diferença depois — o mesmo mecanismo serve para crescer (abrir) e encolher
 * (fechar), porque o Flip mede o antes e o depois de verdade, em vez de fingir uma altura
 * fixa com CSS. Pensado para o cartão de grupo dos acordeões (`AzuosAuditListView`,
 * `AzuosMissingNextUpdateView`, `AzuosOverdueNextUpdateView`).
 *
 * `capture()` roda no MESMO clique que dispara a troca, antes do estado externo mudar (por
 * isso é o handler que chama, não um efeito) — é o "antes" que o Flip precisa medir enquanto
 * o DOM ainda reflete o estado antigo. O `useGSAP` roda depois do commit, vê a altura NOVA
 * (React já montou ou desmontou o conteúdo, do jeito de sempre) e anima só a diferença.
 *
 * Por desenhar assim, a montagem em si continua 100% síncrona — nada aqui atrasa o
 * `isOpen` real nem o desmonte, então nenhum teste que conta com abrir/fechar instantâneo
 * precisa mudar.
 */
export function useFlipToggle<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);
  const stateRef = useRef<Flip.FlipState | null>(null);

  const capture = () => {
    if (ref.current) stateRef.current = Flip.getState(ref.current, { props: 'height' });
  };

  useGSAP(() => {
    const state = stateRef.current;
    stateRef.current = null;
    if (!state || !ref.current || prefersReducedMotion()) return;

    Flip.from(state, { duration: DURATION.base, ease: EASE.inOut, props: 'height' });
  }, [dependency]);

  return { ref, capture };
}
