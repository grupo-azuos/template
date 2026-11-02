import { useId, useState } from 'react';

import {
  type FieldMask,
  fieldMaskError,
  formatStoredFieldMask,
  handleFieldMask,
} from '../../utils/field-mask.util';

import { useMaskedField } from '../../hooks/use-masked-field/use-masked-field';
import { cn } from '../../utils/cn.util';

/**
 * O CAMPO COM MÁSCARA — CPF, CIN, CNPJ, CEP, CNAE, dinheiro, quantidade, CNH. O mesmo rótulo, a mesma
 * régua e o mesmo erro colado do `AzuosTextField`; muda o que acontece a cada tecla.
 *
 * - A pontuação entra sozinha enquanto se digita ou cola ("12345678909" → "123.456.789-09").
 * - Letra não entra em campo de número, e o que passa do tamanho é cortado.
 * - O cursor não pula para o fim quando se corrige um dígito no meio (`useMaskedField`).
 * - O ERRO DE FORMATO aparece quando a pessoa SAI do campo, ou quando ele fica completo e não
 *   fecha (CPF com o dígito verificador errado). Reclamar a cada tecla deixaria o campo vermelho
 *   durante a digitação inteira — incompleto não é errado, é alguém no meio do trabalho.
 *
 * A regra de cada máscara é do `shared` (`field-mask.util.ts`), a mesma que o servidor confere: a
 * tela avisa antes, o servidor recusa igual.
 *
 * `state.error` é o erro de QUEM USA o campo (obrigatório, por exemplo) e ganha do de formato.
 */
export type AzuosMaskedTextFieldProps = {
  data: { label: string; name: string; value: string; placeholder?: string; isRequired?: boolean };
  ui: { mask: FieldMask; className?: string; ariaLabel?: string };
  state?: { error?: string | null; isDisabled?: boolean };
  actions: { onChange: (value: string) => void; onBlur?: () => void };
};

const PLACEHOLDERS: Partial<Record<FieldMask, string>> = {
  cpf: '000.000.000-00',
  cin: '000.000.000-00 (número do CPF)',
  cnpj: '00.000.000/0000-00',
  cep: '00000-000',
  cnae: '0000-0/00',
  money: '0,00',
  phone: '62 90000-0000',
};

/** Dinheiro e CNPJ (alfanumérico) abrem o teclado certo no celular; o resto, só números. */
const INPUT_MODES: Record<FieldMask, 'numeric' | 'decimal' | 'text'> = {
  cpf: 'numeric',
  cin: 'numeric',
  cnpj: 'text',
  cep: 'numeric',
  cnae: 'numeric',
  money: 'decimal',
  integer: 'numeric',
  cnh: 'numeric',
  phone: 'numeric',
};

export function AzuosMaskedTextField({ data, ui, state, actions }: AzuosMaskedTextFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const { ref, moveCursorTo } = useMaskedField();
  const [isTouched, setIsTouched] = useState(false);

  const error = state?.error ?? (isTouched ? fieldMaskError(ui.mask, data.value) : null);
  const hasError = Boolean(error);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = handleFieldMask(ui.mask, {
      value: event.target.value,
      selectionStart: event.target.selectionStart,
    });
    moveCursorTo(result.selectionStart);
    /* Completo e errado já avisa sem esperar sair do campo: o CPF fechou com o dígito trocado. */
    if (result.isComplete && result.error) setIsTouched(true);
    actions.onChange(result.value);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', ui.className)}>
      <label htmlFor={inputId} className="text-ink-700 text-sm font-medium">
        {data.label}
        {data.isRequired ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        name={data.name}
        type="text"
        inputMode={INPUT_MODES[ui.mask]}
        autoComplete="off"
        value={formatStoredFieldMask(ui.mask, data.value)}
        placeholder={data.placeholder ?? PLACEHOLDERS[ui.mask]}
        disabled={state?.isDisabled}
        required={data.isRequired}
        aria-label={ui.ariaLabel}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        onChange={onChange}
        onBlur={() => {
          setIsTouched(true);
          actions.onBlur?.();
        }}
        className={cn(
          'control-lg rounded-control text-foreground w-full border text-sm tabular-nums transition-colors',
          'placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-60',
          hasError ? 'border-border bg-destructive-soft' : 'border-input bg-muted text-foreground',
        )}
      />
      {hasError ? (
        <p id={errorId} role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
