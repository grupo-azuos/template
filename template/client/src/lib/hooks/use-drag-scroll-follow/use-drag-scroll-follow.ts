import { useEffect, useRef } from 'react';

/**
 * O bloco arrastado continua debaixo do mouse quando a tela rola no meio do arrasto.
 *
 * A biblioteca de arrastar só recalcula a posição quando o mouse MEXE. Rolar a tela com a
 * rodinha — ou a rolagem automática da própria biblioteca, quando o bloco encosta na borda — anda
 * o conteúdo sem mexer o mouse: o bloco fica para trás, longe da mão e da sombra de onde vai cair.
 * A cada rolagem, este gancho repete o último movimento do mouse no mesmo ponto da tela; a
 * biblioteca refaz a conta com a rolagem nova e o bloco volta para baixo do cursor.
 *
 * Só mouse: no toque, a rolagem é o próprio dedo, e o arrasto já para de rolar a tela.
 */
export function useDragScrollFollow(): {
  onStart: (event?: Event) => void;
  onStop: () => void;
} {
  const isActive = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!isActive.current) return;

      lastPoint.current = { x: event.clientX, y: event.clientY };
    };
    const onScroll = () => {
      const point = lastPoint.current;
      if (!isActive.current || !point) return;

      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: point.x, clientY: point.y, bubbles: true }),
      );
    };

    /* Na captura: a rolagem de uma caixa interna (o corpo do diálogo) não sobe até o documento. */
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('scroll', onScroll, true);

    return () => {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, []);

  return {
    onStart: (event) => {
      isActive.current = true;
      lastPoint.current =
        event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : null;
    },
    onStop: () => {
      isActive.current = false;
      lastPoint.current = null;
    },
  };
}
