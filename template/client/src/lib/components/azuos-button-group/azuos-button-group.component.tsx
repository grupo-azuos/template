import { useSlidingIndicator } from '../../motion/use-sliding-indicator';
import { cn } from '../../utils/cn.util';

/**
 * Botões que são UMA escolha só, lado a lado (Dia · Semana · Mês, as abas de um contrato).
 *
 * O DESENHO É O SEGMENTADO: um trilho com borda e um respiro por dentro, e o escolhido como uma
 * pastilha azul que DESLIZA até o novo. A pastilha mora dentro do trilho — tem a mesma forma na
 * ponta e no meio, e nunca cobre a borda. (Era o `ui/button-group` do shadcn, com bordas coladas e
 * só as pontas arredondadas: a pastilha redonda por cima ficava com um canto redondo encostado num
 * reto, e saía da borda do grupo.)
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
  /* Deitado, é a pílula do padrão Apple. Em pé, a pílula vira um losango esticado: o trilho
     ganha o canto de campo e as opções ocupam a largura toda, alinhadas à esquerda. */
  const isVertical = ui.orientation === 'vertical';
  const ref = useSlidingIndicator<HTMLDivElement>({
    selector: '[aria-pressed="true"]',
    indicatorClass: cn(isVertical ? 'rounded-control' : 'rounded-full', 'bg-primary shadow-xs'),
    attributes: ['aria-pressed'],
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ui.ariaLabel}
      className={cn(
        'bg-muted inline-flex w-fit gap-1 p-1',
        isVertical ? 'rounded-box min-w-40 flex-col' : 'rounded-full',
        ui.className,
      )}
    >
      {data.options.map((option) => {
        const isSelected = option.value === data.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={state?.isDisabled}
            /* O hover do não escolhido é o véu NEUTRO: um azul claro ali parecia escolhido. */
            className={cn(
              'control-sm px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200',
              isVertical ? 'rounded-control w-full text-left' : 'rounded-full',
              'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isSelected
                ? 'text-primary-foreground'
                : 'text-foreground hover:bg-hover-veil hover:text-foreground',
            )}
            onClick={() => actions?.onChange?.(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
