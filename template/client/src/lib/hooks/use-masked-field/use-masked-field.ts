import { useLayoutEffect, useRef } from 'react';

/**
 * Devolve o cursor ao lugar depois que um campo mascarado se reescreve.
 *
 * O handler puro (`handleTaxIdInput`, `handleMunicipalRegistrationInput`) sabe ONDE o cursor
 * deve ficar; ele só não tem como mexer no DOM. Este hook é a outra metade: guarda a posição
 * que o handler calculou e a aplica depois que o React repintou.
 *
 * Por que `useLayoutEffect` e não `useEffect`: o `useEffect` roda depois da pintura, e o
 * cursor apareceria no fim do campo por um quadro antes de voltar — um pisca a cada tecla.
 *
 * `useRef` para o DOM é um dos hooks permitidos dentro de componente de UI: ele não busca
 * dado nenhum. Mora em `lib/hooks` porque é genérico — não sabe o que é CNPJ nem inscrição.
 */
export function useMaskedField() {
  const ref = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    const at = pendingCursor.current;
    if (!field || at === null) return;

    /* Zerado antes de aplicar: sem isso o efeito reposicionaria o cursor em TODO render,
       inclusive quando quem mexeu no campo foi a pessoa, com o mouse. */
    pendingCursor.current = null;
    field.setSelectionRange(at, at);
  });

  return {
    ref,
    moveCursorTo: (at: number) => {
      pendingCursor.current = at;
    },
  };
}
