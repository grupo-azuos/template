import { useId } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Um campo de texto longo: rótulo, área e erro. Mesmo contrato do `AzuosTextField`.
 *
 * O erro fica COLADO no campo, e não num resumo no topo: resumo obriga a pessoa a procurar qual dos
 * campos ele descreve.
 *
 * O contador aparece só perto do limite (80%). Contador o tempo todo é ruído; contador nenhum é
 * descobrir o limite quando o servidor recusa.
 */
export type AzuosTextAreaFieldProps = {
  data: {
    label: string;
    name: string;
    value: string;
    placeholder?: string;
    maxLength?: number;
    /** Pinta um `*` vermelho depois do rótulo — ver `AzuosTextField`. */
    isRequired?: boolean;
  };
  ui?: { rows?: number; className?: string };
  state?: { error?: string | null; isDisabled?: boolean };
  actions?: { onChange?: (value: string) => void; onBlur?: () => void };
};

export function AzuosTextAreaField({ data, ui, state, actions }: AzuosTextAreaFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const error = state?.error ?? null;

  return (
    <div className={cn('flex flex-col gap-1.5', ui?.className)}>
      <FieldLabel data={{ id: inputId, label: data.label, isRequired: data.isRequired }} />

      <textarea
        id={inputId}
        name={data.name}
        value={data.value}
        rows={ui?.rows ?? 4}
        placeholder={data.placeholder}
        disabled={state?.isDisabled}
        required={data.isRequired}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => actions?.onChange?.(event.target.value)}
        onBlur={() => actions?.onBlur?.()}
        className={textAreaClassName(Boolean(error))}
      />

      <div className="flex items-start justify-between gap-2">
        <FieldError data={{ id: errorId, message: error }} />
        <CharacterCount data={{ length: data.value.length, maxLength: data.maxLength }} />
      </div>
    </div>
  );
}

/**
 * O rótulo com o `*` de obrigatório. O texto do rótulo continua limpo, sem caractere solto — assim o
 * leitor de tela não lê "Descrição asterisco", e a obrigatoriedade chega por `required`, que é o
 * atributo que ele anuncia.
 */
function FieldLabel({ data }: { data: { id: string; label: string; isRequired?: boolean } }) {
  return (
    <label htmlFor={data.id} className="text-ink-700 text-sm font-medium">
      {data.label}
      {data.isRequired ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

/**
 * O lugar do erro existe mesmo vazio (um `<span>`): sem ele, o contador salta da direita para a
 * esquerda no instante em que o erro aparece.
 */
function FieldError({ data }: { data: { id: string; message: string | null } }) {
  if (!data.message) return <span />;

  return (
    <p id={data.id} role="alert" className="text-destructive text-xs font-medium">
      {data.message}
    </p>
  );
}

function textAreaClassName(hasError: boolean): string {
  return cn(
    /* O raio de CONTROLE da régua de medidas (`lib/theme/tokens.css`), o mesmo do `AzuosTextField` e
       do `AzuosActionButton`. A altura não entra: aqui ela é o número de linhas, e um campo
       multilinha com 40px fixos não caberia texto nenhum. */
    'rounded-control',
    'bg-card text-foreground w-full resize-y border px-3 py-2.5 text-sm transition-colors',
    'placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-60',
    hasError ? 'border-destructive' : 'border-input',
  );
}

function CharacterCount({ data }: { data: { length: number; maxLength?: number } }) {
  if (!data.maxLength) return null;
  if (data.length < data.maxLength * 0.8) return null;

  return (
    <span
      className={cn(
        'shrink-0 text-xs tabular-nums',
        data.length > data.maxLength ? 'text-destructive font-semibold' : 'text-ink-500',
      )}
    >
      {data.length}/{data.maxLength}
    </span>
  );
}
