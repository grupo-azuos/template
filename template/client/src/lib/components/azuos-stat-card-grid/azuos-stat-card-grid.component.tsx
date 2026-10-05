import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * A fileira de cartões do topo do painel.
 *
 * Existe como componente, e não como uma `className` repetida em cada tela, porque o número de
 * colunas é uma decisão de LEITURA, não de layout: quatro cartões por linha é o limite do que se
 * compara de relance, e acima disso a fileira vira uma lista que ninguém varre. Repetida à mão,
 * essa decisão se perde na primeira tela nova.
 */
export type AzuosStatCardGridProps = {
  ui?: { className?: string };
  children?: ReactNode;
};

export function AzuosStatCardGrid({ ui, children }: AzuosStatCardGridProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', ui?.className)}>{children}</div>
  );
}
