import { LayoutDashboard, TriangleAlert, X } from 'lucide-react';
import { type ReactNode } from 'react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosBackButton } from '../azuos-back-button/azuos-back-button.component';

/**
 * A FAIXA DO RECORTE DO PAINEL — no alto da tela aberta por um clique num item do Dashboard. Diz
 * de onde a lista veio ("Tarefas por status · Status: Concluída · Últimos 30 dias"), leva de volta
 * ao Dashboard e oferece o "Limpar recorte", que devolve a tela aos filtros dela.
 *
 * Fica PRESA no alto (`sticky`) enquanto o recorte vale: a lista rola por baixo, e quem rolou não
 * esquece que está vendo um pedaço. Com `notice`, é o aviso de que o recorte não valeu (o filtro
 * salvo dele sumiu) — a tela abriu sem ele.
 */
export type AzuosBoardDrillBannerProps = {
  data: {
    /** O recorte em partes: o bloco, o item clicado, o período e o resto. */
    summary: string[];
    /** O aviso de que o recorte não valeu. Com ele, a faixa é de aviso, e não de recorte. */
    notice: string | null;
  };
  actions: { onClear: () => void; onBack: () => void };
};

export function AzuosBoardDrillBanner({ data, actions }: AzuosBoardDrillBannerProps) {
  if (data.notice) {
    return (
      <BannerFrame>
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-box bg-warning-soft px-4 py-3 text-sm text-foreground"
        >
          <BackToBoard onBack={actions.onBack} />
          <TriangleAlert size={16} aria-hidden="true" className="shrink-0" />
          <span className="flex-1">{data.notice}</span>
          <AzuosActionButton
            data={{ label: 'Entendi' }}
            ui={{ variant: 'ghost', size: 'sm', icon: X }}
            actions={{ onClick: actions.onClear }}
          />
        </div>
      </BannerFrame>
    );
  }

  return (
    <BannerFrame>
      <section
        aria-label="Recorte do painel"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-box bg-info-soft px-4 py-3 text-sm text-foreground"
      >
        <BackToBoard onBack={actions.onBack} />
        <LayoutDashboard size={16} aria-hidden="true" className="shrink-0" />
        <span className="font-semibold">Recorte do painel:</span>
        <ul className="flex flex-1 flex-wrap gap-1" aria-label="O recorte">
          {data.summary.map((part) => (
            <li
              key={part}
              className="rounded-chip bg-card px-2 py-0.5 text-xs font-semibold text-ink-700"
            >
              {part}
            </li>
          ))}
        </ul>
        <AzuosActionButton
          data={{ label: 'Limpar recorte' }}
          ui={{ variant: 'ghost', size: 'sm', icon: X }}
          actions={{ onClick: actions.onClear }}
        />
      </section>
    </BannerFrame>
  );
}

/**
 * A moldura presa no alto: o mesmo respiro lateral das telas (`px-6`), e o fundo da página por
 * trás, para a lista que rola não aparecer na fresta acima da faixa.
 */
function BannerFrame({ children }: { children: ReactNode }) {
  return <div className="sticky top-0 z-20 bg-background px-6 pt-4">{children}</div>;
}

function BackToBoard({ onBack }: { onBack: () => void }) {
  return (
    <AzuosBackButton
      data={{ destination: 'o Dashboard' }}
      ui={{ className: 'self-center' }}
      actions={{ onClick: onBack }}
    />
  );
}
