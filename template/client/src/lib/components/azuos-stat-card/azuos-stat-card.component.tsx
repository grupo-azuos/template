import { type LucideIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

import {
  type AzuosCardSemanticTone,
  type AzuosCardTone,
  cardHueFromHex,
  cardToneClasses,
} from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { Skeleton } from '../ui/skeleton';

/**
 * O número que se lê de relance, no alto do painel.
 *
 * A cor vem da paleta única de card (`lib/utils/card-tone.util.ts`): fundo pastel e texto escuro
 * do mesmo matiz, igual nos dois temas, sem opacidade e sem cor cheia. O tom aceita o nome de
 * estado (`danger`, `info`…) ou o matiz direto (`violet`, `teal`…). Borda colorida, nunca.
 *
 * `hint` existe para o número que EXCLUI algo — "exclui 1.067 arquivados", escrito miúdo ao lado do
 * total. Um número que exclui algo precisa dizer o que excluiu, ou viram dois painéis discordando
 * sobre a mesma base.
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
    /** Uma cor que a PESSOA escolheu (`#rrggbb`): vira o matiz mais próximo da paleta e vence o tom. */
    color?: string | null;
  };
  state?: {
    isLoading?: boolean;
    /** O filtro que este cartão liga já está valendo. Só faz sentido com `actions.onClick`. */
    isSelected?: boolean;
  };
  /** Com `onClick` o cartão vira um atalho: clicar nele filtra a lista pelo que ele conta. */
  actions?: { onClick?: () => void };
};

/** A pastilha no tom (prazo, situação): o pastel médio do matiz, com o texto dele. */
export const STAT_TONE_BADGE: Record<AzuosCardSemanticTone, string> = {
  brand: cardToneClasses('brand').chip,
  neutral: cardToneClasses('neutral').chip,
  default: cardToneClasses('default').chip,
  success: cardToneClasses('success').chip,
  warning: cardToneClasses('warning').chip,
  danger: cardToneClasses('danger').chip,
  info: cardToneClasses('info').chip,
};

/**
 * A casca do cartão. Cartão é SUPERFÍCIE: o mesmo raio do `Card`, do diálogo e da tabela.
 * Clicável: no hover fica mais claro, sobe um pouco e ganha sombra, para avisar que responde.
 */
const statCard = tv({
  base: 'rounded-surface shadow-card p-5 transition-all',
  variants: {
    isClickable: {
      true: 'relative cursor-pointer hover:-translate-y-0.5 hover:shadow-xl',
      false: '',
    },
  },
  defaultVariants: { isClickable: false },
});

/** O tom do cartão: a cor escolhida pela pessoa, se houver, vira o matiz; senão, o tom pedido. */
function toneOf(ui: AzuosStatCardProps['ui']): AzuosCardTone {
  if (ui?.color) return cardHueFromHex(ui.color);

  return ui?.tone ?? 'neutral';
}

/** O fundo: o pastel do matiz, o mais claro no hover, o médio quando escolhido. */
function surfaceOf(tone: AzuosCardTone, isClickable: boolean, isSelected: boolean): string {
  const classes = cardToneClasses(tone);
  if (isSelected) return classes.selected;

  return cn(classes.surface, isClickable && classes.hover);
}

export function AzuosStatCard({ data, ui, state, actions }: AzuosStatCardProps) {
  const tone = toneOf(ui);
  const isClickable = Boolean(actions?.onClick);
  const isSelected = Boolean(state?.isSelected);

  return (
    <div
      className={cn(
        statCard({ isClickable }),
        surfaceOf(tone, isClickable, isSelected),
        ui?.className,
      )}
    >
      {isClickable ? <StatCardClickTarget data={data} state={state} actions={actions} /> : null}

      <StatCardLabel data={data} tone={tone} ui={ui} isSelected={isSelected} />

      {state?.isLoading ? (
        <Skeleton className="mt-1 h-8 w-20" />
      ) : (
        <StatCardValue data={data} ui={ui} />
      )}
    </div>
  );
}

/** O número e a ressalva ao lado dele. `items-baseline` alinha os dois pela linha do texto. */
function StatCardValue({ data, ui }: Pick<AzuosStatCardProps, 'data' | 'ui'>) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <p
        className={cn(
          'font-bold tabular-nums',
          ui?.size === 'lg' ? 'text-4xl' : 'text-3xl font-semibold tracking-tight',
        )}
      >
        {data.value}
      </p>

      {data.hint ? <p className="mt-0.5 text-xs font-medium">{data.hint}</p> : null}
    </div>
  );
}

/**
 * O clique é um BOTÃO de verdade, estendido por cima do cartão inteiro: alcançável pelo teclado e
 * anunciado pelo leitor de tela, sem trocar a marcação do cartão — parágrafo dentro de botão não é
 * HTML válido, e envolver tudo num `<button>` é o jeito mais comum de quebrar isso.
 */
function StatCardClickTarget({
  data,
  state,
  actions,
}: Pick<AzuosStatCardProps, 'data' | 'state' | 'actions'>) {
  return (
    <button
      type="button"
      className="rounded-surface absolute inset-0 cursor-pointer"
      aria-pressed={Boolean(state?.isSelected)}
      aria-label={
        state?.isSelected ? `${data.label}: tirar o filtro` : `${data.label}: filtrar a lista`
      }
      onClick={actions?.onClick}
    />
  );
}

/** Com ícone, o rótulo fica ao lado da bolinha; sem ícone, sozinho em cima do número. */
function StatCardLabel({
  data,
  tone,
  ui,
  isSelected,
}: {
  data: AzuosStatCardProps['data'];
  tone: AzuosCardTone;
  ui: AzuosStatCardProps['ui'];
  isSelected: boolean;
}) {
  const Icon = ui?.icon;
  const classes = cardToneClasses(tone);
  const label = (
    <p className="text-xs leading-none font-semibold tracking-wider uppercase">{data.label}</p>
  );

  if (!Icon) return <div className="mb-1">{label}</div>;

  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span
        className={cn(
          'rounded-chip inline-flex size-8 shrink-0 items-center justify-center [&>svg]:block [&>svg]:shrink-0',
          isSelected ? classes.chipSelected : classes.chip,
        )}
      >
        <Icon size={16} className="block size-4 shrink-0 stroke-[1.8]" aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}
