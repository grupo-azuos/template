import { Slider as SliderPrimitive } from 'radix-ui';
import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Um controle deslizante com NOME — o Slider do Radix, com o visual do shadcn/ui.
 *
 * Não é o `slider.tsx` do shadcn embrulhado: aquele desenha a alça (`role="slider"`) sem aceitar
 * rótulo, e o `aria-label` posto na raiz não chega nela. O leitor de tela anunciava só
 * "controle deslizante", sem dizer de quê. Como o vendor não se edita (CONTRIBUTING §5), este
 * primitivo monta as mesmas peças do Radix e dá o nome à alça.
 *
 * Os ícones das pontas (`ui.startIcon`/`ui.endIcon`) são decoração: o nome está no rótulo.
 */
export type AzuosSliderFieldProps = {
  data: { label: string; value: number; min: number; max: number; step: number };
  ui?: { startIcon?: ReactNode; endIcon?: ReactNode; className?: string };
  state?: { isDisabled?: boolean };
  actions?: { onChange?: (value: number) => void };
};

export function AzuosSliderField({ data, ui, state, actions }: AzuosSliderFieldProps) {
  return (
    <div className={cn('flex items-center gap-3', ui?.className)}>
      {ui?.startIcon}
      <SliderPrimitive.Root
        min={data.min}
        max={data.max}
        step={data.step}
        value={[data.value]}
        disabled={state?.isDisabled}
        onValueChange={([value]) => actions?.onChange?.(value ?? data.min)}
        className="relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50"
      >
        <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={data.label}
          className="border-border bg-card block size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none"
        />
      </SliderPrimitive.Root>
      {ui?.endIcon}
    </div>
  );
}
