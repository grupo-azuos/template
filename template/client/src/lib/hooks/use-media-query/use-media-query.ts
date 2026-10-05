import { useSyncExternalStore } from 'react';

/**
 * "A janela está abaixo de `breakpoint` px?" — para o que o CSS não resolve.
 *
 * Classe responsiva do Tailwind basta para esconder e mostrar. Não basta quando a DECISÃO é de
 * JavaScript: quantos rótulos a teia do gráfico desenha, se a lista vira cartões, se a gaveta
 * abre por cima. Nesses casos o componente precisa do valor, não de uma classe.
 *
 * `useSyncExternalStore` em vez de `useState` + `useEffect`: o valor já sai certo no primeiro
 * render. Com estado próprio, a tela renderiza uma vez com o palpite errado e corrige depois — na
 * largura em que a tabela vira cartões, isso é um salto visível a cada abertura.
 */

/* Mesmo ponto de quebra da troca tabela -> cartão (`xl`, 1280px). Abaixo disso a coluna de
   conteúdo é estreita — no tablet deitado os dois gráficos dividem ~750px —, e sem a forma
   compacta os nomes em volta da teia saem cortados pela borda. */
export const XL_BREAKPOINT = 1280;

/** Uma inscrição por ponto de quebra: dez gráficos na tela dividem o mesmo ouvinte, não dez. */
const subscriptions = new Map<number, (onChange: () => void) => () => void>();

function subscriberFor(breakpoint: number): (onChange: () => void) => () => void {
  const existing = subscriptions.get(breakpoint);
  if (existing) return existing;

  const subscribe = (onChange: () => void): (() => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};

    const media = window.matchMedia(queryOf(breakpoint));
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  };

  subscriptions.set(breakpoint, subscribe);

  return subscribe;
}

const queryOf = (breakpoint: number) => `(max-width: ${breakpoint - 1}px)`;

function snapshotOf(breakpoint: number): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;

  return window.matchMedia(queryOf(breakpoint)).matches;
}

/**
 * No servidor não há janela, e o padrão é "não é estreito": a tela nasce no formato completo. O
 * contrário — nascer compacta e crescer — é o mesmo salto por outro caminho.
 */
export function useMediaQueryBelow(breakpoint: number): boolean {
  return useSyncExternalStore(
    subscriberFor(breakpoint),
    () => snapshotOf(breakpoint),
    () => false,
  );
}
