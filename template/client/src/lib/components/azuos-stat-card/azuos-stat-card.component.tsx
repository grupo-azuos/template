import { type LucideIcon } from 'lucide-react';

import {
  type AzuosCardSemanticTone,
  type AzuosCardTone,
  cardHueFromHex,
  cardToneClasses,
} from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';
import { Skeleton } from '../ui/skeleton';

/**
 * O CARD DE PAINEL e o FILTRO GRANDE com ícone: o número que se lê de relance.
 *
 * Fica na superfície da marca (`AzuosCardSurface`); o tom é só sotaque: a bolinha do ícone e o
 * número. Com `onClick` vira filtro, e o escolhido fica no azul claro da marca com texto branco e
 * a bolinha invertida. O tom aceita o nome de estado (`danger`…) ou o sotaque (`plum`…); a cor que
 * a PESSOA escolheu (`ui.color`) vira o sotaque mais próximo.
 *
 * `hint` existe para o número que EXCLUI algo — "exclui 1.067 arquivados", escrito miúdo ao lado do
 * total. Um número que exclui algo precisa dizer o que excluiu.
 */
export type AzuosStatCardTone = AzuosCardTone;

export type AzuosStatCardProps = {
  data: {
    label: string;
    value: number | string;
    hint?: string | null;
  };
  ui?: {
    tone?: AzuosStatCardTone;
    size?: 'md' | 'lg';
    className?: string;
    icon?: LucideIcon;
    /** Uma cor que a PESSOA escolheu (`#rrggbb`): vira o sotaque mais próximo e vence o tom. */
    color?: string | null;
    /** O hover pinta a mancha no sotaque do card, em vez do véu neutro. */
    isHoverColored?: boolean;
  };
  state?: {
    isLoading?: boolean;
    /** O filtro que este cartão liga já está valendo. Só faz sentido com `actions.onClick`. */
    isSelected?: boolean;
  };
  /** Com `onClick` o cartão vira um atalho: clicar nele filtra a lista pelo que ele conta. */
  actions?: { onClick?: () => void };
};

/** A pastilha no tom (prazo, situação): a superfície neutra com o texto no sotaque. */
export const STAT_TONE_BADGE: Record<AzuosCardSemanticTone, string> = {
  brand: cn('bg-muted', cardToneClasses('brand').text),
  neutral: cn('bg-muted', cardToneClasses('neutral').text),
  default: cn('bg-muted', cardToneClasses('default').text),
  success: cn('bg-muted', cardToneClasses('success').text),
  warning: cn('bg-muted', cardToneClasses('warning').text),
  danger: cn('bg-muted', cardToneClasses('danger').text),
  info: cn('bg-muted', cardToneClasses('info').text),
};

/** O tom do cartão: a cor escolhida pela pessoa, se houver, vira o sotaque; senão, o tom pedido. */
function toneOf(ui: AzuosStatCardProps['ui']): AzuosCardTone {
  if (ui?.color) return cardHueFromHex(ui.color);

  return ui?.tone ?? 'neutral';
}

export function AzuosStatCard({ data, ui, state, actions }: AzuosStatCardProps) {
  const tone = toneOf(ui);
  const isSelected = Boolean(state?.isSelected);
  /* O nome lido pelo leitor de tela leva o número, e diz o que o próximo clique faz. */
  const named = `${data.label} ${data.value}`;
  const label = isSelected ? `${named}: tirar o filtro` : `${named}: filtrar a lista`;

  return (
    <AzuosCardSurface
      data={{ label: actions?.onClick ? label : data.label }}
      ui={{
        className: cn('p-5', ui?.className),
        isHoverColored: ui?.isHoverColored,
        hoverTone: tone,
      }}
      state={{ isSelected, isDisabled: state?.isLoading }}
      actions={actions}
    >
      <StatCardLabel data={data} tone={tone} ui={ui} />

      {state?.isLoading ? (
        <Skeleton className="mt-1 h-8 w-20" />
      ) : (
        <StatCardValue data={data} ui={ui} tone={tone} />
      )}
    </AzuosCardSurface>
  );
}

/** O número no sotaque, e a ressalva ao lado dele. No escolhido, tudo branco. */
function StatCardValue({
  data,
  ui,
  tone,
}: Pick<AzuosStatCardProps, 'data' | 'ui'> & { tone: AzuosCardTone }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <p
        className={cn(
          'font-bold tabular-nums group-data-[selected=true]/card:text-on-card-selected',
          cardToneClasses(tone).text,
          ui?.size === 'lg' ? 'text-4xl' : 'text-3xl tracking-tight',
        )}
      >
        {data.value}
      </p>

      {data.hint ? (
        <p className="text-muted-foreground group-data-[selected=true]/card:text-on-card-selected mt-0.5 text-xs">
          {data.hint}
        </p>
      ) : null}
    </div>
  );
}

/** Com ícone, o rótulo fica ao lado da bolinha; sem ícone, sozinho em cima do número. */
function StatCardLabel({
  data,
  tone,
  ui,
}: {
  data: AzuosStatCardProps['data'];
  tone: AzuosCardTone;
  ui: AzuosStatCardProps['ui'];
}) {
  const Icon = ui?.icon;
  const label = (
    <p className="text-xs leading-none font-semibold tracking-wider uppercase">{data.label}</p>
  );

  if (!Icon) return <div className="mb-1.5">{label}</div>;

  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={cn(
          'rounded-chip inline-flex size-9 shrink-0 items-center justify-center',
          'group-data-[selected=true]/card:bg-on-card-selected group-data-[selected=true]/card:text-card-selected',
          cardToneClasses(tone).dot,
        )}
      >
        <Icon size={18} className="block size-4.5 shrink-0 stroke-[1.8]" aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}
