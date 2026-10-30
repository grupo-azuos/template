import { Check, Palette, Shuffle } from 'lucide-react';

import { COMPANY_COLOR_PALETTE, isHexColor } from '../../utils/company-color.util';
import { cn } from '../../utils/cn.util';

/**
 * Escolha de cor: "aleatória", as cinco da paleta, e qualquer outra pelo seletor do navegador.
 *
 * A paleta vem primeiro porque é o caminho curto e o seguro — as cinco aguentam texto branco
 * por cima. O seletor livre existe para quem quer a cor da marca do cliente; se ela for clara,
 * o cartão troca o texto para escuro sozinho (`isLightColor`).
 *
 * `value` vazio é "aleatória", e o botão diz isso por escrito: um quadrado sem cor nenhuma
 * marcado não comunica "o sistema escolhe para você". Onde a cor é obrigatória (a cor da tag),
 * `ui.allowRandom: false` tira o botão.
 */
export type AzuosColorSwatchFieldProps = {
  data: { value: string };
  ui?: { allowRandom?: boolean; ariaLabel?: string };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string) => void };
};

export function AzuosColorSwatchField({ data, ui, state, actions }: AzuosColorSwatchFieldProps) {
  const value = data.value.toLowerCase();
  const isCustom = isHexColor(value) && !COMPANY_COLOR_PALETTE.some((color) => color === value);

  return (
    <div
      role="radiogroup"
      aria-label={groupLabelOf(ui)}
      className="flex flex-wrap items-center gap-2"
    >
      <RandomSwatch
        data={{ isChecked: !value }}
        ui={ui}
        state={state}
        actions={{ onChoose: () => actions.onChange('') }}
      />

      {COMPANY_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={`Cor ${color}`}
          title={color}
          disabled={state?.isDisabled}
          onClick={() => actions.onChange(color)}
          style={{ backgroundColor: color }}
          className={cn(
            'control-lg flex size-10 items-center justify-center rounded-control text-primary-foreground transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === color && 'scale-105 shadow-xs',
          )}
        >
          {value === color ? <Check size={16} aria-hidden="true" /> : null}
        </button>
      ))}

      {/* O `<input type="color">` é o próprio quadrado: clicar abre o seletor do sistema. */}
      <label
        title="Outra cor"
        className={cn(
          'control-lg relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-control border border-dashed border-input transition hover:scale-105 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          isCustom && 'border-solid shadow-xs',
        )}
        style={isCustom ? { backgroundColor: value } : undefined}
      >
        <span className="sr-only">Outra cor</span>
        {isCustom ? (
          <Check size={16} className="text-primary-foreground" aria-hidden="true" />
        ) : (
          <Palette className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          type="color"
          value={isHexColor(value) ? value : COMPANY_COLOR_PALETTE[0]}
          disabled={state?.isDisabled}
          onChange={(event) => actions.onChange(event.target.value.toLowerCase())}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function groupLabelOf(ui: AzuosColorSwatchFieldProps['ui']): string {
  return ui?.ariaLabel ?? 'Cor do cartão';
}

function RandomSwatch({
  data,
  ui,
  state,
  actions,
}: {
  data: { isChecked: boolean };
  ui?: AzuosColorSwatchFieldProps['ui'];
  state?: { isDisabled?: boolean };
  actions: { onChoose: () => void };
}) {
  if (ui?.allowRandom === false) return null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={data.isChecked}
      disabled={state?.isDisabled}
      onClick={actions.onChoose}
      className={cn(
        'control-lg flex items-center gap-1.5 rounded-control border px-3 text-sm font-medium transition',
        data.isChecked
          ? 'bg-primary text-primary-foreground'
          : 'border-input text-foreground hover:bg-muted',
      )}
    >
      <Shuffle size={14} aria-hidden="true" />
      Aleatória
    </button>
  );
}
