import { Construction, type LucideIcon } from 'lucide-react';

import { AzuosPageHeader } from '../azuos-page-header/azuos-page-header.component';

/**
 * A tela de uma área do sistema que ainda não foi construída.
 *
 * Ela existe porque um MVP cresce por partes, e sem ela o menu mentiria de duas formas: escondendo
 * áreas que já foram combinadas (dando a impressão de que o sistema é menor do que vai ser) ou
 * mostrando um item que abre uma tela em branco (dando a impressão de que quebrou).
 *
 * Por isso ela NÃO é um "em breve" vazio: lista o que aquela área vai fazer. Assim a tela informa
 * mesmo antes de funcionar, e quem abre consegue conferir se o que está previsto é o que precisa.
 *
 * Quando a área for construída, esta tela é substituída pela de verdade — este componente não deve
 * sobreviver ao fim do MVP.
 */
export type AzuosPendingAreaProps = {
  data: {
    title: string;
    /** Uma linha dizendo para que serve a área. */
    summary: string;
    /** O que ela vai permitir fazer, em frases curtas. */
    features: string[];
    /** O que precisa existir antes dela. Vazio quando nada bloqueia. */
    dependsOn?: string | null;
  };
  ui?: { icon?: LucideIcon };
};

export function AzuosPendingArea({ data, ui }: AzuosPendingAreaProps) {
  const Icon = ui?.icon ?? Construction;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pb-10 sm:px-6">
      <AzuosPageHeader data={{ title: data.title, description: data.summary }} />

      <section className="border-ink-300 bg-card rounded-surface border border-dashed p-6">
        <div className="flex items-start gap-3">
          <Icon className="text-ink-500 mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-ink-900 text-base font-semibold">
              Esta área ainda não foi construída
            </h2>
            <p className="text-ink-700 mt-1 text-sm">O que está previsto para ela:</p>

            <ul className="text-ink-700 mt-3 flex flex-col gap-1.5 text-sm">
              {data.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span
                    className="bg-ink-300 mt-2 size-1.5 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="break-words">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Dizer o que falta antes evita a pergunta "por que não fizeram esta primeiro?".

                A frase é nominal ("Antes desta área: X") de propósito. Com verbo, a concordância
                quebra conforme a dependência seja uma ou duas — "depende de o Relatório e os
                Clientes estar pronto" não é português. Sem verbo, a mesma frase serve para qualquer
                quantidade. */}
            {data.dependsOn ? (
              <p className="text-ink-500 mt-4 text-sm">
                Antes desta área: <strong className="font-semibold">{data.dependsOn}</strong>.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
