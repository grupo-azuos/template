import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

/**
 * A trilha de onde a pessoa está: "Tarefas › Revisar contrato › Histórico". Envolve o
 * `ui/breadcrumb` do shadcn.
 *
 * O ÚLTIMO item é sempre a página atual, e por isso nunca é link — clicar nele não levaria a lugar
 * nenhum, e link que não vai a lugar nenhum é o tipo de coisa que faz alguém clicar duas vezes e
 * concluir que a tela travou. Os de antes são link quando têm `href`; sem `href`, viram texto.
 */
export type AzuosBreadcrumbEntry = { label: string; href?: string };

export type AzuosBreadcrumbProps = {
  data: { items: AzuosBreadcrumbEntry[] };
  ui?: { className?: string };
};

export function AzuosBreadcrumb({ data, ui }: AzuosBreadcrumbProps) {
  /* Trilha vazia não é uma trilha: sem itens, nada é desenhado. */
  if (data.items.length === 0) return null;

  return (
    <Breadcrumb aria-label="Você está em" className={ui?.className}>
      <BreadcrumbList className="text-ink-500 text-sm">
        {data.items.map((item, index) => {
          const isLast = index === data.items.length - 1;

          return (
            <Fragment key={item.label + index}>
              <BreadcrumbItem>
                <BreadcrumbEntryLabel data={{ item, isLast }} />
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Página atual, link ou texto — as três formas que uma parada da trilha pode ter. */
function BreadcrumbEntryLabel({ data }: { data: { item: AzuosBreadcrumbEntry; isLast: boolean } }) {
  const { item, isLast } = data;

  if (isLast) {
    return (
      <BreadcrumbPage className="text-ink-900 font-medium break-words">{item.label}</BreadcrumbPage>
    );
  }

  if (item.href) {
    return (
      <BreadcrumbLink href={item.href} className="hover:text-ink-900 break-words">
        {item.label}
      </BreadcrumbLink>
    );
  }

  return <span className="break-words">{item.label}</span>;
}
