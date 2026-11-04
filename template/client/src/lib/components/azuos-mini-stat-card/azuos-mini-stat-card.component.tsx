import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';

/**
 * O FILTRO PEQUENO: uma fileira de contagens por status (o painel tem uma), cada uma clicável.
 *
 * Superfície da marca (`AzuosCardSurface`), bolinha e número no sotaque do status. Escolhido = o
 * azul claro da marca com texto branco. O hover é a mancha do GSAP; colorida com
 * `ui.isHoverColored`.
 */
export type AzuosMiniStatCardProps = {
  data: { label: string; value: number | string };
  ui?: { tone?: AzuosCardTone; isHoverColored?: boolean; className?: string };
  state?: { isSelected?: boolean };
  actions?: { onClick?: () => void };
};

export function AzuosMiniStatCard({ data, ui, state, actions }: AzuosMiniStatCardProps) {
  const tone = cardToneClasses(ui?.tone);

  return (
    <AzuosCardSurface
      data={{ label: `${data.label}: ${data.value}` }}
      ui={{
        className: cn('rounded-box px-3 py-2.5', ui?.className),
        isHoverColored: ui?.isHoverColored,
        hoverTone: ui?.tone,
      }}
      state={state}
      actions={actions}
    >
      <div className="flex min-w-0 items-center gap-2 text-xs leading-tight font-semibold tracking-wide uppercase">
        <span
          aria-hidden="true"
          className={cn(
            'size-2.5 shrink-0 rounded-full group-data-[selected=true]/card:bg-on-card-selected',
            tone.swatch,
          )}
        />
        <span className="truncate" title={data.label}>
          {data.label}
        </span>
      </div>
      <div
        className={cn(
          'mt-1 text-xl leading-tight font-bold tabular-nums group-data-[selected=true]/card:text-on-card-selected',
          tone.text,
        )}
      >
        {data.value}
      </div>
    </AzuosCardSurface>
  );
}
