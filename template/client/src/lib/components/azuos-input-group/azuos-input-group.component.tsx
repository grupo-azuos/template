import { useId, type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';

/**
 * Um campo de texto com algo colado nele: um ícone ou um prefixo na frente (`R$`, uma lupa), uma
 * unidade ou um botão atrás (`kg`, "copiar"). Envolve o `ui/input-group` do shadcn.
 *
 * A altura é a de todo campo de formulário (`control-lg`, 40px) e o raio é o de controle —
 * definidos AQUI, e não no `ui/`, que o CLI sobrescreve, nem na tela, que não decide altura.
 *
 * Sem prefixo nem sufixo, use o `AzuosTextField`: é o mesmo campo, sem o grupo em volta.
 */
export type AzuosInputGroupProps = {
  data: {
    label: string;
    name: string;
    value: string;
    placeholder?: string;
  };
  ui?: { className?: string };
  state?: { error?: string | null; isDisabled?: boolean };
  actions?: { onChange?: (value: string) => void; onBlur?: () => void };
  /** O que fica colado na frente do texto. */
  prefix?: ReactNode;
  /** O que fica colado atrás do texto. */
  suffix?: ReactNode;
};

/**
 * O fundo do grupo, repetido no escuro de propósito: o `ui/input-group` do shadcn traz
 * `dark:bg-input/30`, que vence um `bg-muted` solto no tema escuro e deixava este campo mais claro
 * que o `AzuosTextField` ao lado. Só a mesma variante (`dark:`) derruba a dele.
 */
const FILL_CLASS = {
  normal: 'bg-muted dark:bg-muted',
  error: 'bg-destructive-soft dark:bg-destructive-soft',
} as const;

export function AzuosInputGroup({
  data,
  ui,
  state,
  actions,
  prefix,
  suffix,
}: AzuosInputGroupProps) {
  const inputId = useId();
  const errorId = inputId + '-error';

  const error = state?.error ?? null;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', ui?.className)}>
      <label htmlFor={inputId} className="text-ink-700 text-sm font-medium">
        {data.label}
      </label>

      {/* `px-0!`: o `control-lg` traz o respiro lateral de um campo sozinho; aqui quem dá o respiro
          é o prefixo, o sufixo e o próprio input de dentro. */}
      <InputGroup
        className={cn(
          'control-lg rounded-control px-0!',
          hasError ? FILL_CLASS.error : FILL_CLASS.normal,
        )}
      >
        {prefix ? <InputGroupAddon>{prefix}</InputGroupAddon> : null}

        {/* `text-foreground`: o `Input` do vendor herdava uma cor quase branca dentro do grupo, e o
            valor digitado sumia no fundo do cartão. */}
        <InputGroupInput
          id={inputId}
          className="text-foreground"
          name={data.name}
          value={data.value}
          placeholder={data.placeholder}
          disabled={state?.isDisabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(event) => actions?.onChange?.(event.target.value)}
          onBlur={() => actions?.onBlur?.()}
        />

        {suffix ? <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon> : null}
      </InputGroup>

      {hasError ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
