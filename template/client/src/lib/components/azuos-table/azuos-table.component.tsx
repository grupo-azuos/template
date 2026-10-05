import { type ComponentProps, type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

/**
 * A TABELA DA CASA: o `ui/table` do shadcn dentro de uma superfície (raio, borda, fundo e sombra de
 * cartão), com um rodapé opcional para a fonte do dado e a contagem.
 *
 * Tudo isto normalmente acaba editado à mão dentro de `ui/table` — e some no próximo `shadcn add`.
 * Aqui o `ui/` fica original e a aparência mora neste arquivo, nas peças nomeadas abaixo. Quem usa
 * importa todas daqui, nunca de `components/ui`.
 *
 * `TableBody` e `TableCaption` são reexportados sem nada por cima: não têm aparência própria da casa,
 * e envolvê-los só para reexportar seria um arquivo que não decide nada.
 */
export type AzuosTableProps = ComponentProps<typeof Table> & {
  /** Classes da superfície em volta — para a tabela que já mora dentro de um cartão. */
  containerClassName?: string;
  /** Fonte do dado à esquerda, contagem à direita. */
  footer?: ReactNode;
};

export function AzuosTable({
  className,
  containerClassName,
  footer,
  children,
  ...rest
}: AzuosTableProps) {
  return (
    <div
      data-slot="table-surface"
      className={cn(
        'border-border bg-card rounded-surface w-full overflow-hidden border shadow-xs',
        containerClassName,
      )}
    >
      {/* Quem rola para o lado é a caixa de dentro (o contêiner do próprio shadcn), não a página:
          uma tabela larga que rola a página inteira arrasta o menu lateral junto. */}
      <Table className={cn('text-left', className)} {...rest}>
        {children}
      </Table>

      {footer ? (
        <div className="border-border/80 bg-muted/40 text-ink-500 flex items-center justify-between border-t px-6 py-3 text-xs">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/**
 * O cabeçalho: faixa de fundo suave, letra pequena em caixa alta. O `ui/table` vem sem nada disso.
 */
export function AzuosTableHeader({ className, ...rest }: ComponentProps<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn(
        'border-border/80 bg-muted/70 text-ink-500 border-b text-xs font-semibold tracking-widest uppercase',
        className,
      )}
      {...rest}
    />
  );
}

/**
 * A célula de cabeçalho. `h-auto` desfaz a altura fixa do shadcn: aqui quem dá a altura é o respiro
 * (`py-3.5`), o mesmo da célula de dado, para as duas alinharem.
 */
export function AzuosTableHead({ className, ...rest }: ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        'text-ink-500 h-auto px-6 py-3.5 text-xs font-semibold tracking-widest uppercase',
        '[&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...rest}
    />
  );
}

/** A linha: divisória mais leve que a borda de fora, e nenhuma depois da última. */
export function AzuosTableRow({ className, ...rest }: ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn('border-border/60 hover:bg-muted/80 last:border-b-0', className)}
      {...rest}
    />
  );
}

/**
 * A célula de dado. O shadcn não deixa o texto quebrar (`whitespace-nowrap`); aqui ele quebra, porque
 * nome e descrição compridos não podem alargar a tabela. Só a célula de AÇÕES (a que tem botão) fica
 * numa linha só — um par de botões quebrado em duas linhas desalinha a coluna inteira.
 */
export function AzuosTableCell({ className, ...rest }: ComponentProps<typeof TableCell>) {
  return (
    <TableCell
      className={cn(
        'px-6 py-3.5 text-sm whitespace-normal [&>[role=checkbox]]:translate-y-[2px]',
        '[&_button]:align-middle [&:has(button)]:whitespace-nowrap',
        className,
      )}
      {...rest}
    />
  );
}

/**
 * O `<tfoot>`, para totais em linha de tabela. O rodapé com a fonte do dado e a contagem é a prop
 * `footer` do `AzuosTable`, não este.
 */
export function AzuosTableFooter({ className, ...rest }: ComponentProps<typeof TableFooter>) {
  return (
    <TableFooter
      className={cn(
        'border-border/80 bg-muted/40 text-ink-500 px-6 py-3 text-xs font-normal',
        className,
      )}
      {...rest}
    />
  );
}

/** O par de botões no fim da linha, alinhado à direita e sempre numa linha só. */
export function AzuosTableActions({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="table-actions"
      className={cn('inline-flex items-center justify-end gap-1.5 align-middle', className)}
      {...rest}
    />
  );
}

export { TableBody as AzuosTableBody, TableCaption as AzuosTableCaption };
