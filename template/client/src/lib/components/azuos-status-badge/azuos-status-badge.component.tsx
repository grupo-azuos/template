import { type LucideIcon } from 'lucide-react';

import { cardHueFromHex, cardToneClasses } from '../../utils/card-tone.util';
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

/* O selo segue os cards: fundo neutro, texto no sotaque do tom (`lib/utils/card-tone.util.ts`). */
const TONE_CLASSES: Record<AzuosStatusBadgeTone, string> = {
  neutral: cn('bg-muted', cardToneClasses('neutral').text),
  info: cn('bg-muted', cardToneClasses('info').text),
  success: cn('bg-muted', cardToneClasses('success').text),
  warning: cn('bg-muted', cardToneClasses('warning').text),
  danger: cn('bg-muted', cardToneClasses('danger').text),
  brand: cn('bg-muted', cardToneClasses('brand').text),
};

export function AzuosStatusBadge({ data, ui }: AzuosStatusBadgeProps) {
  /* Situação vazia não é uma situação: um selo cinza escrito "—" faria parecer que alguém
     respondeu algo. Linha que ninguém tocou fica sem selo. */
  if (!data.label) {
    return <span className={cn('text-xs text-ink-500', ui?.className)}>Não preenchido</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap',
        ui?.size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1',
        resolveToneClass(ui),
        ui?.className,
      )}
    >
      <BadgeIcon icon={ui?.icon} />
      {/* O texto num `span` próprio: com `max-w-*` em `ui.className`, o selo corta com reticências
          em vez de empurrar a coluna — quem precisa do texto inteiro o mostra num tooltip. */}
      <span className="min-w-0 truncate">{data.label}</span>
    </span>
  );
}

/** A cor escolhida vence o tom: vira o matiz mais próximo da paleta, sem mistura com opacidade. */
function resolveToneClass(ui: AzuosStatusBadgeProps['ui']): string {
  if (ui?.color) return cn('bg-muted', cardToneClasses(cardHueFromHex(ui.color)).text);

  return TONE_CLASSES[ui?.tone ?? 'neutral'];
}

function BadgeIcon({ icon: Icon }: { icon?: LucideIcon }) {
  if (!Icon) return null;

  return <Icon className="size-3 shrink-0" aria-hidden="true" />;
}
