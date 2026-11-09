import { useId, useRef } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * O CÓDIGO DE SEIS NÚMEROS, uma caixa por dígito.
 *
 * Seis caixas em vez de um campo só porque o código chega para ser COPIADO de um e-mail e
 * conferido dígito a dígito. Num campo único a pessoa perde a conta no meio e digita cinco;
 * aqui a caixa vazia é visível de longe.
 *
 * O componente é controlado por um valor só — a string inteira —, e não por seis estados.
 * Seis estados obrigariam o view-model a costurá-los de volta a cada tecla, e é no meio
 * dessa costura que nascem os códigos com um dígito fora de ordem.
 *
 * O que ele resolve, e que um `<input>` solto não resolve:
 *
 * - **Colar funciona.** O código vem do e-mail pela área de transferência, inteiro. Sem o
 *   tratamento do `paste`, colar preenche UMA caixa e a pessoa apaga tudo e digita à mão.
 * - **Apagar volta.** `Backspace` numa caixa vazia vai para a anterior e apaga lá. Sem isso
 *   a pessoa fica presa na última caixa, apagando o nada.
 * - **`autocomplete="one-time-code"`** deixa o iOS e o Android oferecerem o código do SMS ou
 *   do e-mail direto no teclado — e ele vai só na PRIMEIRA caixa, que é onde o sistema
 *   operacional procura.
 * - **`inputMode="numeric"`** abre o teclado numérico no celular. Sem ele, seis dígitos são
 *   seis trocas de teclado.
 */
export type AzuosOtpFieldProps = {
  data: {
    label: string;
    /* O código inteiro, do tamanho que estiver: a view desenha uma caixa por posição. */
    value: string;
    length: number;
  };
  ui?: { className?: string };
  state?: { error?: string | null; isDisabled?: boolean; isAutoFocused?: boolean };
  actions?: {
    onChange?: (value: string) => void;
    /* Chamado quando a última caixa é preenchida — é o que permite conferir sem clicar. */
    onComplete?: (value: string) => void;
  };
};

export function AzuosOtpField({ data, ui, state, actions }: AzuosOtpFieldProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const { error, isDisabled, isAutoFocused } = resolveState(state);
  const digits = toDigits(data.value, data.length);
  const hasError = Boolean(error);

  function commit(next: string): void {
    actions?.onChange?.(next);
    if (next.length === data.length) actions?.onComplete?.(next);
  }

  function focusAt(index: number): void {
    inputs.current[clamp(index, data.length)]?.focus();
  }

  function handleInput(index: number, raw: string): void {
    const typed = onlyDigits(raw);
    if (typed === '') return;

    /* Mais de um dígito numa caixa só é o autopreenchimento do sistema operacional entregando
       o código inteiro. Ele entra a partir daqui, e não só nesta caixa. */
    const next = replaceFrom(digits, index, typed, data.length);
    commit(next);
    focusAt(index + typed.length);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);

      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);

      return;
    }

    if (event.key !== 'Backspace') return;

    event.preventDefault();
    /* Caixa cheia: apaga aqui e fica. Caixa vazia: volta uma e apaga lá — é o que faz o
       apagar contínuo funcionar sem a pessoa mover o cursor. */
    const target = digits[index] === '' ? index - 1 : index;
    if (target < 0) return;

    commit(eraseAt(digits, target));
    focusAt(target);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    const pasted = onlyDigits(event.clipboardData.getData('text'));
    if (pasted === '') return;

    event.preventDefault();
    const next = pasted.slice(0, data.length);
    commit(next);
    focusAt(next.length);
  }

  return (
    <div className={cn('flex flex-col gap-1.5', ui?.className)}>
      <span id={groupId} className="text-sm font-medium text-ink-700">
        {data.label}
      </span>

      {/* `role="group"` com o rótulo: sem ele o leitor de tela anuncia seis campos sem nome,
          e a pessoa não sabe o que está preenchendo. */}
      {/* Seis caixas de 48px com 8px entre elas pedem 328px SÓ para os campos. Num iPhone SE
          (320px de largura, menos a margem da tela) a sexta caixa ficava do lado de fora e o
          formulário inteiro ganhava rolagem lateral.

          A correção não é um tamanho menor fixo — seria a mesma conta com outro número, e
          `data.length` é um parâmetro: com 8 dígitos estoura de novo. As caixas DIVIDEM a
          largura que existe (`flex-1`), com teto de 48px para não incharem numa tela larga.
          `aspect-square` mantém o quadrado sem precisar saber a largura de antemão. */}
      <div role="group" aria-labelledby={groupId} className="flex justify-between gap-1.5 sm:gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            value={digit}
            disabled={isDisabled}
            autoFocus={isAutoFocused && index === 0}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            /* `maxLength` alto de propósito: com `1`, o autopreenchimento do celular entrega
               o código inteiro e o navegador corta em um dígito antes de qualquer código
               nosso rodar. O corte para o tamanho certo é feito acima. */
            maxLength={data.length}
            aria-label={`Dígito ${index + 1} de ${data.length}`}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            className={cn(
              'aspect-square w-full max-w-12 min-w-0 flex-1 rounded-control border text-center text-lg font-semibold transition-colors',
              'focus:ring-2 focus:ring-brand-blue-800/20 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              hasError
                ? 'border-border bg-destructive-soft text-destructive'
                : 'border-input bg-muted text-foreground',
            )}
          />
        ))}
      </div>

      {hasError ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function resolveState(state: AzuosOtpFieldProps['state']): {
  error: string | null;
  isDisabled: boolean;
  isAutoFocused: boolean;
} {
  return {
    error: state?.error ?? null,
    isDisabled: state?.isDisabled ?? false,
    isAutoFocused: state?.isAutoFocused ?? false,
  };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** O valor vira um vetor de tamanho fixo: posição vazia é caixa vazia, e não caixa que sumiu. */
function toDigits(value: string, length: number): string[] {
  return Array.from({ length }, (_, index) => value[index] ?? '');
}

function clamp(index: number, length: number): number {
  return Math.min(Math.max(index, 0), length - 1);
}

/**
 * Escreve a partir de uma posição e devolve o código inteiro.
 *
 * O valor é uma string de dígitos, sem buraco: apagar uma caixa do meio junta o que sobrou à
 * esquerda. É o comportamento certo para como o código é realmente preenchido — da esquerda
 * para a direita, ou colado inteiro —, e o que o mantém sempre pronto para enviar. A
 * alternativa, guardar posições vazias no meio, exigiria um caractere que não é dígito
 * atravessando o view-model e o schema até o servidor.
 */
function replaceFrom(digits: string[], index: number, typed: string, length: number): string {
  const next = [...digits];

  for (let offset = 0; offset < typed.length && index + offset < length; offset += 1) {
    next[index + offset] = typed[offset] ?? '';
  }

  return next.join('');
}

function eraseAt(digits: string[], index: number): string {
  const next = [...digits];
  next[index] = '';

  return next.join('');
}
