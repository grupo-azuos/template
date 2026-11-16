import { type LucideIcon } from 'lucide-react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosContentCard } from '../azuos-content-card/azuos-content-card.component';

/**
 * O NÚMERO NO CARD DE CONTEÚDO — o mesmo card da empresa com tag: o ícone do assunto grande no
 * canto direito, o card tingido no tom, e o número no sotaque.
 *
 * É o card de resumo de uma tela (os totais em cima de uma lista, a equipe no Placar). O texto
 * guarda margem à direita (`pr-24`) para nunca passar por cima do ícone grande.
 */
export type AzuosContentStatCardProps = {
  data: { label: string; value: number | string; hint?: string | null };
  ui: { icon: LucideIcon; tone: AzuosCardTone; className?: string };
};

export function AzuosContentStatCard({ data, ui }: AzuosContentStatCardProps) {
  return (
    <AzuosContentCard
      data={{ label: data.label }}
      ui={{
        icon: ui.icon,
        tone: ui.tone,
        isHoverColored: true,
        className: cn('h-full gap-1 p-5 pr-24', ui.className),
      }}
    >
      <p className="text-xs font-semibold tracking-wider text-foreground uppercase">{data.label}</p>
      <p
        className={cn(
          'text-3xl font-bold tracking-tight tabular-nums',
          cardToneClasses(ui.tone).text,
        )}
      >
        {data.value}
      </p>
      {data.hint ? <p className="text-xs text-muted-foreground">{data.hint}</p> : null}
    </AzuosContentCard>
  );
}
