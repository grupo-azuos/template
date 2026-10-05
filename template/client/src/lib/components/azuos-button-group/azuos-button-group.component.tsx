import { cn } from '../../utils/cn.util';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';

/**
 * Botões que são UMA escolha só, colados um no outro (Dia · Semana · Mês). Envolve o
 * `ui/button-group` do shadcn, que arredonda só as pontas do grupo.
 *
 * Para muitas opções ou espaço estreito, use o `AzuosOptionPicker` (quebra linha e vira seletor);
 * este aqui é para duas a quatro opções curtas que cabem numa fileira.
 *
 * `aria-pressed` em cada botão, e não só a cor: quem usa leitor de tela precisa saber qual está
 * valendo, e "preenchido de azul" não é informação que ele leia.
 */
export type AzuosButtonGroupOption = { value: string; label: string };

export type AzuosButtonGroupProps = {
  data: { options: AzuosButtonGroupOption[]; value: string };
  ui: {
    /** O que o grupo escolhe, para quem usa leitor de tela. */
    ariaLabel: string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
  };
  state?: { isDisabled?: boolean };
  actions?: { onChange?: (value: string) => void };
};

export function AzuosButtonGroup({ data, ui, state, actions }: AzuosButtonGroupProps) {
  return (
    <ButtonGroup aria-label={ui.ariaLabel} orientation={ui.orientation} className={ui.className}>
      {data.options.map((option) => {
        const isSelected = option.value === data.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            aria-pressed={isSelected}
            disabled={state?.isDisabled}
            className={cn('control-md rounded-control', !isSelected && 'bg-card')}
            onClick={() => actions?.onChange?.(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
