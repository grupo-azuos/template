import { useEffect, useRef } from 'react';

/**
 * Avisa quando um elemento entra na tela. É o gatilho do scroll infinito.
 *
 * `rootMargin` de 400px faz o aviso chegar ANTES de o elemento aparecer: a página seguinte
 * começa a ser buscada enquanto ainda há conteúdo para rolar, e a lista não para. Esperar o
 * sentinela ficar visível de verdade daria um solavanco a cada fim de página.
 *
 * O observador é recriado quando `isEnabled` muda porque é assim que ele PARA: sem isso, a
 * última página continuaria pedindo mais a cada rolagem, e o servidor responderia a página
 * vazia para sempre.
 */
export function useOnVisible(
  onVisible: () => void,
  options: { isEnabled: boolean; rootMargin?: string },
): { ref: React.RefObject<HTMLDivElement | null> } {
  const ref = useRef<HTMLDivElement | null>(null);
  /* A callback vive numa ref para o observador não ser recriado a cada render só porque a
     função mudou de identidade — recriar o observador a cada render é como o gatilho dispara
     duas vezes pela mesma rolagem. A ref é escrita num efeito, e não durante o render:
     escrever ref enquanto o React renderiza é justamente o que o modo concorrente proíbe. */
  const callback = useRef(onVisible);

  useEffect(() => {
    callback.current = onVisible;
  }, [onVisible]);

  const { isEnabled, rootMargin = '400px' } = options;

  useEffect(() => {
    const target = ref.current;
    if (!target || !isEnabled) return;

    /* jsdom não implementa `IntersectionObserver`. Sem esta guarda, todo teste que renderize
       uma lista quebraria por causa de um recurso que não é o que ele está testando. */
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { rootMargin },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [isEnabled, rootMargin]);

  return { ref };
}
