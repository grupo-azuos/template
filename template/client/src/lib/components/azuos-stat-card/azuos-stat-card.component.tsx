import { type LucideIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

import { cn } from '../../utils/cn.util';
import { Skeleton } from '../ui/skeleton';

/**
 * O número que se lê de relance, no alto do painel.
 *
 * Quando o cartão tem um tom (danger, info, success, brand, warning), ele ganha o fundo SÓLIDO da
 * cor correspondente, sem borda (o token `-soft` do tom). Sem tom escolhido (neutral), fica neutro
 * com a borda padrão.
 *
 * O `-soft` é sólido de propósito: com opacidade, o cartão mudava de cor conforme o que estivesse
 * atrás dele, e o mesmo indicador ficava de dois tons em duas telas.
 *
 * `hint` existe para o número que EXCLUI algo — "exclui 1.067 arquivados", escrito miúdo ao lado do
 * total. Um número que exclui algo precisa dizer o que excluiu, ou viram dois painéis discordando
 * sobre a mesma base.
 */
export type AzuosStatCardTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

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
  };
  state?: {
    isLoading?: boolean;
    /** O filtro que este cartão liga já está valendo. Só faz sentido com `actions.onClick`. */
    isSelected?: boolean;
  };
  /** Com `onClick` o cartão vira um atalho: clicar nele filtra a lista pelo que ele conta. */
  actions?: { onClick?: () => void };
};

/** O fundo do cartão inteiro: colorido não tem borda; neutro usa `bg-card` com borda. */
const TONE_CARD: Record<AzuosStatCardTone, string> = {
  brand: 'bg-primary-soft text-foreground',
  neutral: 'bg-card border-border border text-card-foreground',
  success: 'bg-success-soft text-foreground',
  warning: 'bg-warning-soft text-foreground',
  danger: 'bg-destructive-soft text-foreground',
  info: 'bg-info-soft text-foreground',
};

const TONE_LABEL: Record<AzuosStatCardTone, string> = {
  brand: 'text-primary',
  neutral: 'text-ink-500',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
};

/** Cor SÓLIDA do quadrado do ícone — nunca o mesmo `-soft` do fundo, senão o ícone some nele. */
const TONE_ICON: Record<AzuosStatCardTone, string> = {
  brand: 'bg-primary text-primary-foreground',
  neutral: 'bg-ink-700 text-primary-foreground',
  success: 'bg-success text-primary-foreground',
  warning: 'bg-warning text-primary-foreground',
  danger: 'bg-destructive text-destructive-foreground',
  info: 'bg-info text-primary-foreground',
};

/**
 * A casca do cartão. Cartão é SUPERFÍCIE: o mesmo raio do `Card`, do diálogo e da tabela
 * (`lib/theme/tokens.css`) — com raio de controle ele encostava visualmente nos botões em volta e
 * parecia um botão grande.
 *
 * Clicável: sobe um pouco no hover, para avisar que responde ao clique. Selecionado: um anel em
 * volta — o fundo já é a cor do tom, então quem marca o estado é o contorno.
 */
const statCard = tv({
  base: 'rounded-surface py-4 pr-4 pl-5 shadow-xs transition-all',
  variants: {
    tone: TONE_CARD,
    isClickable: {
      true: 'relative cursor-pointer hover:-translate-y-0.5 hover:shadow-xl',
      false: '',
    },
    isSelected: { true: 'ring-ring ring-offset-background ring-2 ring-offset-2', false: '' },
  },
  defaultVariants: { tone: 'neutral', isClickable: false, isSelected: false },
});

export function AzuosStatCard({ data, ui, state, actions }: AzuosStatCardProps) {
  const tone = ui?.tone ?? 'neutral';
  const isClickable = Boolean(actions?.onClick);

  return (
    <div
      className={cn(
        statCard({ tone, isClickable, isSelected: Boolean(state?.isSelected) }),
        ui?.className,
      )}
    >
      {isClickable ? <StatCardClickTarget data={data} state={state} actions={actions} /> : null}

      <StatCardLabel data={data} tone={tone} icon={ui?.icon} />

      {state?.isLoading ? (
        <Skeleton className="mt-1 h-8 w-20" />
      ) : (
        <StatCardValue data={data} ui={ui} tone={tone} />
      )}
    </div>
  );
}

/** O número e a ressalva ao lado dele. `items-baseline` alinha os dois pela linha do texto. */
function StatCardValue({
  data,
  ui,
  tone,
}: {
  data: AzuosStatCardProps['data'];
  ui: AzuosStatCardProps['ui'];
  tone: AzuosStatCardTone;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <p
        className={cn(
          'text-foreground font-bold tabular-nums',
          ui?.size === 'lg' ? 'text-4xl' : 'text-3xl font-semibold tracking-tight',
        )}
      >
        {data.value}
      </p>

      {data.hint ? <p className={cn('mt-0.5 text-xs', TONE_LABEL[tone])}>{data.hint}</p> : null}
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

/** Com ícone, o rótulo fica ao lado do quadrado; sem ícone, sozinho em cima do número. */
function StatCardLabel({
  data,
  tone,
  icon: Icon,
}: {
  data: AzuosStatCardProps['data'];
  tone: AzuosStatCardTone;
  icon?: LucideIcon;
}) {
  const label = (
    <p className={cn('text-xs font-semibold tracking-wider uppercase', TONE_LABEL[tone])}>
      {data.label}
    </p>
  );

  if (!Icon) return <div className="mb-1">{label}</div>;

  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span
        className={cn(
          'rounded-chip flex size-8 shrink-0 items-center justify-center',
          TONE_ICON[tone],
        )}
      >
        <Icon size={15} aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}
