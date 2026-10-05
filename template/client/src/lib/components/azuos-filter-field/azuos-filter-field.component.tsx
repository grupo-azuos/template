import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Um filtro com o NOME em cima: "Situação", "Responsável", "Prazo".
 *
 * Sem o nome, três ou quatro controles lado a lado são uma fileira de pastilhas e seletores que não
 * dizem o que cada um filtra — a pessoa descobre por tentativa. O rótulo é o mesmo do campo de
 * formulário (`azuos-text-field`), para a barra de filtros e o "Buscar" acima dela parecerem a
 * mesma família.
 *
 * O controle entra por `children` (um `AzuosOptionPicker`, normalmente). O nome para o leitor de
 * tela continua sendo o `ariaLabel` do próprio controle: este rótulo é visual, e marcar os dois
 * faria o leitor anunciar "Situação Situação".
 */
export type AzuosFilterFieldProps = {
  data: { label: string };
  ui?: { className?: string };
  children?: ReactNode;
};

export function AzuosFilterField({ data, ui, children }: AzuosFilterFieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', ui?.className)}>
      <span className="text-ink-700 text-sm font-medium">{data.label}</span>
      {children}
    </div>
  );
}
