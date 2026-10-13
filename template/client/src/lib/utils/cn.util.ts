import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * O MERGE PRECISA CONHECER A RÉGUA DA CASA (`lib/theme/tokens.css`).
 *
 * O `tailwind-merge` só resolve conflito entre classes que ele sabe serem a mesma propriedade, e
 * de fábrica ele só conhece a escala do Tailwind. `rounded-control` e `control-lg` são nossos: sem
 * este ensino ele não vê que `rounded-control` e `rounded-md` são o mesmo canto, nem que
 * `control-lg` e `h-9` são a mesma altura, e deixa os dois pares no elemento.
 *
 * Com os dois presentes quem vence é o componente baixado (`lib/components/ui`), que traz
 * `rounded-md` e `h-9` de fábrica. Foi assim que um seletor com as classes certas no código
 * apareceu na tela com canto de 8px e 36px de altura, ao lado de campos de 14px e 40px.
 *
 * - `theme.radius`: os quatro papéis de canto entram na mesma família de `rounded-md`.
 * - `control-*`: define altura e respiro lateral, então derruba `h-*` e `px-*` que vieram ANTES.
 *   Um `px-*` ou `h-*` escrito DEPOIS continua valendo — é o ajuste de quem compõe.
 * - `control-icon-*`: define altura e largura, então derruba também `w-*` e `size-*`.
 */
const HORIZONTAL_PADDING = ['px', 'ps', 'pe', 'pl', 'pr'] as const;

const mergeClasses = extendTailwindMerge<'control' | 'control-icon'>({
  extend: {
    theme: { radius: ['surface', 'control', 'box', 'chip'] },
    classGroups: {
      control: [{ control: ['sm', 'md', 'lg'] }],
      'control-icon': [{ 'control-icon': ['sm', 'md', 'lg'] }],
    },
    conflictingClassGroups: {
      control: ['h', ...HORIZONTAL_PADDING, 'control-icon'],
      'control-icon': ['h', 'w', 'size', ...HORIZONTAL_PADDING, 'control'],
    },
  },
});

/**
 * Junta classes e resolve conflito do Tailwind pelo ÚLTIMO valor.
 *
 * Sem o merge, `cn('px-2', className)` com `className="px-6"` deixa as duas classes na
 * marcação e quem vence é a ordem do CSS gerado — que muda entre build de desenvolvimento e
 * de produção. É como um espaçamento fica certo na máquina de quem escreveu e errado no ar.
 */
export function cn(...values: ClassValue[]): string {
  return mergeClasses(clsx(values));
}
