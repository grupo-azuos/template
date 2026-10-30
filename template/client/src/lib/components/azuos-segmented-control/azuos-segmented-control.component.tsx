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
  return (
    <div
      role="group"
      aria-label={ui.ariaLabel}
      className={cn(
        'bg-mantle flex flex-wrap gap-1 rounded-surface p-1',
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
                ? 'text-primary bg-card font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground font-semibold hover:bg-card',
              ui.variant === 'prominent' &&
                'control-lg focus-visible:outline-primary flex-auto px-5 text-base whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-none',
              ui.variant === 'prominent' &&
                (isActive
                  ? 'bg-primary text-primary-foreground shadow-none'
                  : 'bg-primary/10 text-ink-900 hover:bg-primary/20 hover:text-ink-900 shadow-none'),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
