import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Um campo de formulário: rótulo, entrada e erro.
 *
 * O erro fica COLADO no campo, e não num resumo no topo. Resumo obriga a pessoa a procurar qual dos
 * campos ele descreve, e num formulário de quatro campos ela erra a procura — corrige o que estava
 * certo e reenvia o mesmo erro.
 *
 * `date` entra aqui, e não num componente separado, porque só o `type` do `input` muda — rótulo,
 * erro e acessibilidade são exatamente os mesmos.
 */
export type AzuosTextFieldType = 'text' | 'email' | 'password' | 'date' | 'tel';

export type AzuosTextFieldProps = {
  data: {
    label: string;
    name: string;
    value: string;
    placeholder?: string;
    autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
    /**
     * Pinta um `*` vermelho depois do rótulo. O texto do rótulo continua limpo, sem caractere
     * solto — assim o leitor de tela não lê "Nome asterisco", e a obrigatoriedade chega por
     * `required`, que é o atributo que ele anuncia.
     */
    isRequired?: boolean;
  };
  ui?: {
    type?: AzuosTextFieldType;
    /**
     * O teclado que o celular abre. `numeric` para um campo que só recebe dígitos — e não
     * `type="number"`, que traz setinhas, aceita "e" e "-" e esconde o que foi digitado errado.
     */
    inputMode?: 'text' | 'numeric' | 'decimal';
    className?: string;
  };
  state?: {
    error?: string | null;
    isDisabled?: boolean;
    isAutoFocused?: boolean;
  };
  actions?: {
    onChange?: (value: string) => void;
    onBlur?: () => void;
  };
};

export function AzuosTextField({ data, ui, state, actions }: AzuosTextFieldProps) {
  /* `useState` de estado puramente visual e `useId` são o que a seção 3 do CONTRIBUTING permite
     dentro de um componente de UI. Nada aqui busca dado. */
  const [isRevealed, setIsRevealed] = useState(false);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const { type, className } = resolveUi(ui);
  const { error, isDisabled, isAutoFocused } = resolveState(state);
  const { onChange, onBlur } = resolveActions(actions);

  const isPassword = type === 'password';
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-ink-700 text-sm font-medium">
        {data.label}
        {data.isRequired ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <div className="relative">
        <input
          id={inputId}
          name={data.name}
          type={resolveInputType(type, isRevealed)}
          inputMode={ui?.inputMode}
          value={data.value}
          placeholder={data.placeholder}
          autoComplete={data.autoComplete}
          autoFocus={isAutoFocused}
          disabled={isDisabled}
          required={data.isRequired}
          /* `aria-invalid` e `aria-describedby` são o que faz o leitor de tela anunciar o erro. Sem
             eles a mensagem existe na tela e não existe para quem não a vê. */
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur()}
          /* O foco automático sozinho deixa o cursor no fim do texto: um valor mais comprido que a
             caixa nasce rolado, escondendo a primeira letra. Selecionar tudo mostra o valor inteiro
             e já deixa pronto para a pessoa digitar por cima. */
          onFocus={(event) => isAutoFocused && event.currentTarget.select()}
          className={inputClassName({ isPassword, hasError })}
        />

        {isPassword ? (
          <RevealButton
            state={{ isRevealed }}
            actions={{ onToggle: () => setIsRevealed((current) => !current) }}
          />
        ) : null}
      </div>

      {hasError ? <FieldError data={{ id: errorId, message: error ?? '' }} /> : null}
    </div>
  );
}

function resolveUi(ui: AzuosTextFieldProps['ui']) {
  return { type: ui?.type ?? 'text', className: ui?.className };
}

function resolveState(state: AzuosTextFieldProps['state']) {
  return {
    error: state?.error ?? null,
    isDisabled: state?.isDisabled ?? false,
    isAutoFocused: state?.isAutoFocused ?? false,
  };
}

function resolveActions(actions: AzuosTextFieldProps['actions']) {
  return { onChange: actions?.onChange ?? noop, onBlur: actions?.onBlur ?? noop };
}

/**
 * Revelar troca o `type`, e não um CSS: com `-webkit-text-security` o gerenciador de senhas do
 * navegador deixa de reconhecer o campo.
 */
function resolveInputType(type: AzuosTextFieldType, isRevealed: boolean): AzuosTextFieldType {
  if (type !== 'password') return type;

  return isRevealed ? 'text' : 'password';
}

function inputClassName({
  isPassword,
  hasError,
}: {
  isPassword: boolean;
  hasError: boolean;
}): string {
  return cn(
    /* O degrau `lg` da RÉGUA DE MEDIDAS (`lib/theme/tokens.css`): 40px de altura e o raio de
       controle, os mesmos do `AzuosDatePicker`, do `AzuosSelectField` e do `AzuosOptionPicker` de
       formulário. Com a altura vindo só do padding, campo de texto, seletor, data e botão nunca
       alinhavam na mesma fileira nem pareciam a mesma família de controle. */
    'control-lg rounded-control',
    'bg-card text-foreground w-full border text-sm transition-colors',
    'placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-60',
    isPassword && 'pr-11',
    hasError ? 'border-destructive' : 'border-input',
  );
}

/**
 * `tabIndex={-1}` de propósito: no teclado, a tecla seguinte à senha precisa ser o botão de entrar.
 * Parar num olho no meio do caminho atrapalha quem opera sem mouse o dia inteiro.
 */
function RevealButton({
  state,
  actions,
}: {
  state: { isRevealed: boolean };
  actions: { onToggle: () => void };
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={actions.onToggle}
      aria-label={state.isRevealed ? 'Ocultar senha' : 'Mostrar senha'}
      className="text-ink-500 hover:text-ink-700 absolute inset-y-0 right-0 flex w-11 items-center justify-center"
    >
      {state.isRevealed ? (
        <EyeOff className="size-4" aria-hidden />
      ) : (
        <Eye className="size-4" aria-hidden />
      )}
    </button>
  );
}

/** `role="alert"` para o erro ser anunciado quando aparece, e não só quando alguém voltar ao campo. */
function FieldError({ data }: { data: { id: string; message: string } }) {
  return (
    <p id={data.id} role="alert" className="text-destructive text-xs font-medium">
      {data.message}
    </p>
  );
}

function noop(): void {}
