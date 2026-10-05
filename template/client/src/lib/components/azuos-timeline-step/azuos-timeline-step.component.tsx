import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Uma etapa dentro de `AzuosTimeline`.
 *
 * `ui.isLast` é passado por QUEM CHAMA, e não descoberto sozinho, porque o número de etapas de um
 * formulário é fixo e conhecido no próprio arquivo — descobrir isso por CSS exigiria selecionar o
 * último irmão de dentro de um componente que não é o pai da lista. Sem a linha, a última etapa não
 * tem "para onde ir depois", que é o efeito certo.
 */
export type AzuosTimelineStepProps = {
  data: {
    title: string;
    description?: string;
    icon: LucideIcon;
  };
  ui?: { isLast?: boolean; tone?: 'neutral' | 'brand' | 'success'; className?: string };
  children: ReactNode;
};

const ICON_TONE_CLASSES = {
  neutral: 'border-border bg-card text-foreground',
  brand: 'border-primary/30 bg-primary/10 text-primary',
  success: 'border-success/30 bg-success/10 text-success',
} as const;

export function AzuosTimelineStep({ data, ui, children }: AzuosTimelineStepProps) {
  const Icon = data.icon;

  return (
    <div className={cn('flex gap-3.5', ui?.isLast ? 'pb-0' : 'pb-5', ui?.className)}>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full border shadow-xs',
            ICON_TONE_CLASSES[ui?.tone ?? 'neutral'],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {ui?.isLast ? null : <span className="bg-border mt-1 w-px flex-1" aria-hidden="true" />}
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <h3 className="text-foreground text-sm font-semibold">{data.title}</h3>
        {data.description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{data.description}</p>
        ) : null}
        <div className="mt-3 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}
