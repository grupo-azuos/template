import { Loader2, type LucideIcon } from 'lucide-react';
import { tv } from 'tailwind-variants';

import { cn } from '../../utils/cn.util';
import { Button } from '../ui/button';

/**
 * O botão do sistema. Toda ação que não é "enviar formulário" passa por aqui.
 *
 * É o exemplo da seção 5 do CONTRIBUTING: o `Button` baixado do shadcn NÃO é editado nem importado
 * pelas telas. Este componente o envolve e aplica as NOSSAS variantes com `tv()` — o dia em que o
 * CLI sobrescrever o vendor, nenhuma tela muda.
 *
 * A altura e o raio vêm da RÉGUA DE MEDIDAS (`lib/theme/tokens.css`), e não do componente baixado:
 * ele tem a escala dele (32, 28, 24px), que não é a do projeto. Era esse desencontro que deixava o
 * "Cancelar" mais baixo que o "Salvar" no rodapé do diálogo.
 *
 * O `size` do `Button`, mais abaixo, continua entrando — mas só pelo tamanho do ícone e pelo espaço
 * entre ícone e texto. A altura é nossa.
 *
 * Carregando, ele trava e troca o ícone pelo giro: dois cliques em "Excluir" seriam duas
 * requisições, e a segunda voltaria como "não encontrado" de algo que acabou de dar certo.
 */
export const azuosActionButton = tv({
  base: 'rounded-control align-middle font-semibold shadow-xs transition-all',
  variants: {
    variant: {
      primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      secondary: 'border-border bg-card text-foreground hover:bg-accent/50 border',
      ghost:
        'text-foreground/80 hover:bg-accent hover:text-foreground border border-transparent bg-transparent shadow-none',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    size: {
      sm: 'control-sm',
      md: 'control-md',
      lg: 'control-lg',
    },
    /* Botão só de ícone é quadrado: a largura acompanha a ALTURA, e não o ícone dentro — senão a
       lixeira fica mais estreita que o lápis ao lado, numa fileira que deveria ser uma régua só. */
    isIconOnly: { true: '', false: '' },
  },
  compoundVariants: [
    { size: 'sm', isIconOnly: true, class: 'control-icon-sm' },
    { size: 'md', isIconOnly: true, class: 'control-icon-md' },
    { size: 'lg', isIconOnly: true, class: 'control-icon-lg' },
  ],
  defaultVariants: { variant: 'primary', size: 'md', isIconOnly: false },
});

export type AzuosActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type AzuosActionButtonSize = 'sm' | 'md' | 'lg';

export type AzuosActionButtonProps = {
  data: { label: string; loadingLabel?: string };
  ui?: {
    variant?: AzuosActionButtonVariant;
    /**
     * O degrau da régua de medidas (`lib/theme/tokens.css`).
     *
     * `sm` dentro de uma linha de tabela, `md` (o padrão) para a ação da tela e o rodapé do
     * diálogo, `lg` quando o botão divide fileira com um campo de formulário — ali ele tem que ter
     * a altura do campo, não a dele.
     */
    size?: AzuosActionButtonSize;
    icon?: LucideIcon;
    /** Só o ícone aparece; o rótulo vira `aria-label` e dica. Use com parcimônia. */
    isIconOnly?: boolean;
    className?: string;
  };
  state?: {
    isLoading?: boolean;
    isDisabled?: boolean;
    /** Para botão que liga/desliga ou faz parte de uma escolha: anuncia qual está valendo. */
    isPressed?: boolean;
  };
  actions?: { onClick?: () => void };
};

export function AzuosActionButton({ data, ui, state, actions }: AzuosActionButtonProps) {
  /* Os padrões são resolvidos em funções à parte, e não aqui: é o que mantém este componente
     legível como composição, em vez de uma lista de `??` antes do JSX. */
  const { isBusy, isDisabled } = resolveState(state);
  const { Icon, label, accessibleName } = resolveContent(data, ui, isBusy);

  return (
    <Button
      type="button"
      size={buttonSize(ui)}
      disabled={isBusy || isDisabled}
      aria-busy={isBusy}
      aria-pressed={state?.isPressed}
      aria-label={accessibleName}
      title={accessibleName}
      onClick={actions?.onClick}
      className={buttonClassName(ui)}
    >
      <ButtonIcon data={{ Icon }} state={{ isBusy }} />
      {label}
    </Button>
  );
}

/** A classe do botão, resolvida fora do JSX: dentro dele, os `??` somavam complexidade à view. */
function buttonClassName(ui: AzuosActionButtonProps['ui']): string {
  return cn(
    azuosActionButton({
      variant: ui?.variant,
      size: ui?.size,
      isIconOnly: ui?.isIconOnly ?? false,
    }),
    ui?.className,
  );
}

/** O ícone gira enquanto carrega — e some quando não há ícone nenhum. */
function ButtonIcon({
  data,
  state,
}: {
  data: { Icon: LucideIcon | undefined };
  state: { isBusy: boolean };
}) {
  const { Icon } = data;
  if (!Icon) return null;

  return <Icon className={cn(state.isBusy && 'animate-spin')} aria-hidden="true" />;
}

function resolveState(state: AzuosActionButtonProps['state']) {
  return { isBusy: Boolean(state?.isLoading), isDisabled: Boolean(state?.isDisabled) };
}

/** Só ícone: o rótulo sai da tela, mas continua sendo o nome do botão para o leitor de tela. */
function resolveContent(
  data: AzuosActionButtonProps['data'],
  ui: AzuosActionButtonProps['ui'],
  isBusy: boolean,
): { Icon: LucideIcon | undefined; label: string | null; accessibleName: string | undefined } {
  const text = isBusy ? (data.loadingLabel ?? data.label) : data.label;
  const Icon = isBusy ? Loader2 : ui?.icon;
  if (ui?.isIconOnly) return { Icon, label: null, accessibleName: data.label };

  return { Icon, label: text, accessibleName: undefined };
}

/** Do componente baixado sobram o tamanho do ícone e o espaço até o texto. */
const BUTTON_SIZES: Record<AzuosActionButtonSize, 'sm' | 'default' | 'lg'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

const BUTTON_ICON_SIZES: Record<AzuosActionButtonSize, 'icon-sm' | 'icon' | 'icon-lg'> = {
  sm: 'icon-sm',
  md: 'icon',
  lg: 'icon-lg',
};

function buttonSize(
  ui: AzuosActionButtonProps['ui'],
): 'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg' {
  const size = ui?.size ?? 'md';
  if (ui?.isIconOnly) return BUTTON_ICON_SIZES[size];

  return BUTTON_SIZES[size];
}
