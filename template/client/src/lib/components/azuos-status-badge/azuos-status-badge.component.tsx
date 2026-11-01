import { type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';

/**
 * Um selo de situação: texto curto sobre fundo de cor.
 *
 * O TOM É PASSADO, NÃO ESCOLHIDO AQUI. Quem sabe que "Concluída" é verde é o domínio
 * (`taskStatusTone`, em `shared/src/domain`) — deixar cada tela escolher a cor é como a mesma
 * situação aparece verde numa lista e cinza em outra.
 *
 * As cores vêm dos tokens de ESTADO (`lib/theme/tokens.css`), não da paleta crua do Tailwind: um
 * verde fixo escrito aqui não acompanharia a troca de tema, e no escuro o selo ficaria claro com
 * texto claro.
 */
export type AzuosStatusBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

export type AzuosStatusBadgeProps = {
  data: { label: string | null | undefined };
  ui?: {
    tone?: AzuosStatusBadgeTone;
    /**
     * Uma cor que a PESSOA escolheu (`#rrggbb`, o status criado pela equipe) — vence o tom. Vai por
     * `style`: não há token para uma cor que só se sabe quando alguém a escolhe. O fundo é a mesma
     * cor bem diluída, como o `-soft` dos tons.
     */
    color?: string | null;
    /** Um ícone pequeno antes do texto — o do status criado pela equipe, por exemplo. */
    icon?: LucideIcon;
    size?: 'sm' | 'md';
    className?: string;
  };
};

const TONE_CLASSES: Record<AzuosStatusBadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  brand: 'bg-primary-soft text-primary',
};

export function AzuosStatusBadge({ data, ui }: AzuosStatusBadgeProps) {
  /* Situação vazia não é uma situação: um selo cinza escrito "—" faria parecer que alguém
     respondeu algo. Linha que ninguém tocou fica sem selo. */
  if (!data.label) {
    return <span className={cn('text-ink-500 text-xs', ui?.className)}>Não preenchido</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap',
        ui?.size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
        resolveToneClass(ui),
        ui?.className,
      )}
      style={resolveColorStyle(ui?.color)}
    >
      <BadgeIcon icon={ui?.icon} />
      {/* O texto num `span` próprio: com `max-w-*` em `ui.className`, o selo corta com reticências
          em vez de empurrar a coluna — quem precisa do texto inteiro o mostra num tooltip. */}
      <span className="min-w-0 truncate">{data.label}</span>
    </span>
  );
}

/** A cor escolhida vence o tom: com ela, nenhuma classe de cor entra para disputar. */
function resolveToneClass(ui: AzuosStatusBadgeProps['ui']): string {
  if (ui?.color) return '';

  return TONE_CLASSES[ui?.tone ?? 'neutral'];
}

function resolveColorStyle(color: string | null | undefined) {
  if (!color) return undefined;

  return { color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` };
}

function BadgeIcon({ icon: Icon }: { icon?: LucideIcon }) {
  if (!Icon) return null;

  return <Icon className="size-3 shrink-0" aria-hidden="true" />;
}
