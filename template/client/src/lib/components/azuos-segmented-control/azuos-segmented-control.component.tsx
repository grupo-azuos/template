import { useSlidingIndicator } from '../../motion/use-sliding-indicator';
import { cn } from '../../utils/cn.util';

/**
 * Um grupo de botões em que só um fica ligado — para trocar o RECORTE de uma tela ("Faltam
 * documentos", "Prontas para concluir").
 *
 * Botões lado a lado, e não um select: o recorte é a primeira pergunta da tela, e as opções
 * precisam estar à vista para a pessoa saber que existem. Num select, "Prontas para concluir"
 * ficaria escondido atrás de um clique que ninguém dá.
 *
 * O desenho é o segmentado da Trilha Azuos: um trilho no azul-claro do fundo, e a opção ligada
 * como uma "pastilha" branca com sombra, em azul e negrito — ligada se lê pelo relevo e pelo
 * peso, não só pela cor.
 *
 * `aria-pressed` diz ao leitor de tela qual está ligado. Em tela estreita os botões quebram
 * linha dentro do trilho, em vez de empurrar a página para o lado.
 */
export type AzuosSegmentedControlOption = { value: string; label: string };

export type AzuosSegmentedControlProps = {
  data: { value: string; options: AzuosSegmentedControlOption[] };
  ui: { ariaLabel: string; className?: string; variant?: 'default' | 'prominent' };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string) => void };
};

export function AzuosSegmentedControl({ data, ui, state, actions }: AzuosSegmentedControlProps) {
  /* O fundo do escolhido DESLIZA até o novo, como o destaque do menu: a troca de aba se vê. */
  const ref = useSlidingIndicator<HTMLDivElement>({
    selector: '[aria-pressed="true"]',
    indicatorClass:
      ui.variant === 'prominent'
        ? 'rounded-control bg-primary'
        : 'rounded-control bg-card shadow-xs',
    attributes: ['aria-pressed'],
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ui.ariaLabel}
      className={cn(
        'flex flex-wrap gap-1 rounded-surface bg-mantle p-1',
        ui.variant === 'prominent' && 'w-full gap-2 bg-transparent p-0 sm:w-auto',
        ui.className,
      )}
    >
      {data.options.map((option) => {
        const isActive = option.value === data.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            disabled={state?.isDisabled}
            onClick={() => {
              if (isActive) return;
              actions.onChange(option.value);
            }}
            className={cn(
              'rounded-control px-3 py-1.5 text-sm transition-[color,background-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-60',
              isActive
                ? 'font-bold text-primary'
                : 'font-semibold text-muted-foreground hover:bg-card/60 hover:text-foreground',
              ui.variant === 'prominent' &&
                'control-lg flex-auto px-5 text-base whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none',
              ui.variant === 'prominent' &&
                (isActive
                  ? 'text-primary-foreground shadow-none'
                  : 'bg-primary/10 text-ink-900 shadow-none hover:bg-primary/20 hover:text-ink-900'),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
