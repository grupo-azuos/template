import { useState } from 'react';

/**
 * Chama `reset` no render em que um diálogo passa de fechado para aberto.
 *
 * O formulário de um diálogo continua montado enquanto ele está fechado — o `Dialog` só
 * esconde. Sem limpar na abertura, o formulário reabre com o que foi digitado da última vez:
 * salvar um cadastro e abrir "novo" trazia o anterior preenchido, pronto para virar duplicata.
 *
 * Roda DURANTE o render, e não num `useEffect` — é o padrão do React para ajustar estado
 * quando uma prop muda. Com efeito, o diálogo pintaria um quadro com o formulário velho antes
 * de limpar. E limpa na ABERTURA, não no fechamento, porque é a abertura que sabe qual
 * cadastro vai ser mostrado — inclusive a edição que acabou de ser salva.
 *
 * Não é para todo diálogo: o de alvará mantém o que foi digitado de propósito, porque reabre
 * para continuar editando o que já foi inserido.
 */
export function useResetOnOpen(isOpen: boolean, reset: () => void): void {
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen === wasOpen) return;

  setWasOpen(isOpen);
  if (isOpen) reset();
}
