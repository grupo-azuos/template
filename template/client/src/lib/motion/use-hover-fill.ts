import { useCallback, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

import { effectsActions } from '../hooks/use-effects/use-effects';

/**
 * O preenchimento no hover (utilidade `hover-fill`, em `lib/theme/tokens.css`).
 *
 * O CSS sabe crescer o círculo; o que ele não sabe é POR ONDE o mouse entrou. Este hook anota o
 * ponto de entrada — e o de saída, para o círculo encolher em direção a ele — em duas variáveis
 * CSS do próprio elemento. Nada aqui roda a cada quadro: são dois eventos por passagem do mouse.
 *
 * Devolve propriedades para espalhar no elemento (`{...fill.handlers}` + `style={fill.style}`), e
 * não uma `ref`: assim o componente não precisa guardar um nó nem rodar efeito nenhum.
 */

/** Os tons de situação do `AzuosStatusBadge`, aqui só para escolher a cor do preenchimento. */
export type FillTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

/* O tom SUAVE, e não a cor cheia: o texto do item continua por cima e tem de seguir legível. */
const FILL_COLORS: Record<FillTone, string> = {
  neutral: 'var(--muted)',
  info: 'var(--info-soft)',
  success: 'var(--success-soft)',
  warning: 'var(--warning-soft)',
  danger: 'var(--destructive-soft)',
  brand: 'var(--primary-soft)',
};

export function fillColorOf(tone: FillTone | null | undefined): string {
  return FILL_COLORS[tone ?? 'neutral'] ?? FILL_COLORS.neutral;
}

/** Quanto dura o crescimento do círculo — o mesmo valor do `transition` em `tokens.css`. */
const FILL_DURATION_MS = 450;

export type HoverFill = {
  /**
   * A cor do preenchimento, já como variável CSS inline.
   *
   * O tipo é `CSSProperties` com uma asserção: o React aceita propriedade customizada em `style` em
   * tempo de execução, mas o tipo dele só conhece as propriedades padrão do CSS.
   */
  style: CSSProperties;
  handlers: {
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void;
  };
};

export function useHoverFill(tone?: FillTone | null): HoverFill {
  const place = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const node = event.currentTarget;
    const box = node.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;

    node.style.setProperty('--fill-x', `${x}px`);
    node.style.setProperty('--fill-y', `${y}px`);
    /* Até onde o círculo precisa crescer para cobrir o item: a distância ao canto mais longe. O
       CSS usa isto como o raio da camada — ela fica do tamanho exato, não maior. */
    const reach = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));
    node.style.setProperty('--fill-reach', `${Math.ceil(reach)}px`);
  }, []);

  /* A entrada é quando a animação começa: é a hora de medir se a máquina a entrega lisa. Se não
     entregar, o nível de efeitos cai para o leve sozinho (`lib/hooks/use-effects`). */
  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      place(event);
      effectsActions.onAnimationStart(FILL_DURATION_MS);
    },
    [place],
  );

  return {
    style: { '--fill-color': fillColorOf(tone) } as CSSProperties,
    handlers: { onPointerEnter, onPointerLeave: place },
  };
}
