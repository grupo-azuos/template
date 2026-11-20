import { useId } from 'react';

import { cn } from '../../utils/cn.util';
import { Checkbox } from '../ui/checkbox';

/**
 * Uma caixa de marcar com o rótulo ao lado — a escolha de "sim ou não" que não precisa de
 * "não sei" (para isso, use um `AzuosSelectField` com a opção vazia).
 *
 * É o `Checkbox` do shadcn (Radix): teclado (espaço marca), foco e leitor de tela vêm prontos. O
 * rótulo inteiro é clicável, porque acertar um quadrado de 16px o dia todo cansa — e a linha tem a
 * altura da régua (`control-md`), para o alvo do toque não ser só a caixa.
 */
export type AzuosCheckboxFieldProps = {
  data: { label: string; name: string; isChecked: boolean; description?: string };
  /** `isLabelHidden`: numa linha de tabela o contexto já diz o que é; o rótulo fica só para o leitor de tela. */
  ui?: { isLabelHidden?: boolean; className?: string };
  state?: { isDisabled?: boolean };
  actions?: { onChange?: (isChecked: boolean) => void };
};

export function AzuosCheckboxField({ data, ui, state, actions }: AzuosCheckboxFieldProps) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const isDisabled = state?.isDisabled === true;

  /* A caixinha e o rótulo numa linha só, CENTRADOS um no outro; a descrição embaixo, alinhada
     ao rótulo (e não à caixinha). Antes a caixinha ia pelo topo do texto e a altura era fixa
     (`control-md`) mesmo com descrição — o visto ficava torto em relação ao rótulo. A régua de
     altura vale para o campo sozinho; com descrição, ele cresce o que precisa. */
  return (
    <div
      className={cn(
        'flex flex-col justify-center gap-0.5',
        data.description ? 'py-2' : 'control-md',
        ui?.className,
      )}
    >
      <div className="flex min-h-5 items-center gap-2">
        <Checkbox
          id={inputId}
          name={data.name}
          checked={data.isChecked}
          disabled={isDisabled}
          aria-describedby={data.description ? descriptionId : undefined}
          onCheckedChange={(checked) => actions?.onChange?.(checked === true)}
          className="bg-muted shrink-0"
        />
        <label
          htmlFor={inputId}
          className={cn(
            'text-foreground min-w-0 cursor-pointer text-sm leading-5 break-words',
            ui?.isLabelHidden && 'sr-only',
            isDisabled && 'text-muted-foreground cursor-not-allowed',
          )}
        >
          {data.label}
        </label>
      </div>
      {data.description ? (
        <p id={descriptionId} className="text-muted-foreground pl-6 text-xs">
          {data.description}
        </p>
      ) : null}
    </div>
  );
}
