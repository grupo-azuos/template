import { type LucideIcon } from 'lucide-react';
import { useId } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Escolher um ícone numa grade de prontos. Botões que ligam e desligam (`aria-pressed`), e não um
 * `<select>`: ícone se escolhe vendo, e uma lista de nomes ("shield-check") não diz nada a ninguém.
 *
 * Cada ícone tem um nome em português no `aria-label` e no `title` — é ele que o leitor de tela
 * anuncia e que aparece ao passar o mouse.
 */
export type AzuosIconPickerOption = { value: string; label: string; icon: LucideIcon };

export type AzuosIconPickerProps = {
  data: { value: string | null; options: AzuosIconPickerOption[] };
  ui: { label: string; className?: string };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string) => void };
};

export function AzuosIconPicker({ data, ui, state, actions }: AzuosIconPickerProps) {
  const labelId = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', ui.className)}>
      <span id={labelId} className="text-ink-700 text-sm font-medium">
        {ui.label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {data.options.map(({ value, label, icon: Icon }) => {
          const isSelected = value === data.value;

          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              title={label}
              disabled={state?.isDisabled}
              onClick={() => actions.onChange(value)}
              className={cn(
                'rounded-control focus-visible:ring-ring flex size-(--control-lg) cursor-pointer items-center justify-center border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-ink-700 hover:bg-muted',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
