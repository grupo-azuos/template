import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { type HTMLAttributes, useId, useState } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * O campo de texto com RECURSOS A MAIS que o `AzuosRichTextField` do template não tem: dica embaixo
 * (`data.hint`), ícone de lupa com Enter (`ui.icon` + `actions.onSubmit`), limite de caracteres,
 * `inputMode` e o tipo `month`. Sem nenhum desses, use o `AzuosRichTextField`.
 *
 * Este arquivo também é o KIT DE CAMPO do projeto: `FIELD_CONTROL_CLASS`, `FieldLabel`,
 * `FieldError` e `FieldHint` são o que o seletor com busca, o calendário e o campo de sugestões
 * usam para ficar na mesma família visual do campo de texto.
 *
 * O erro fica COLADO no campo, e não num resumo no topo. Resumo obriga a pessoa a
 * procurar qual dos campos ele descreve, e num formulário de quatro campos ela erra a
 * procura — corrige o que estava certo e reenvia o mesmo erro.
 *
 * A dica (`data.hint`) é a linha miúda que explica de onde o valor veio ("Calculado: 45 dias a
 * partir do início."). Ela sai quando há erro: duas mensagens embaixo do mesmo campo competem, e
 * a que importa é a do erro.
 */

/**
 * A ALTURA DO RÓTULO mais o vão até o campo — para encostar um controle SEM rótulo na mesma
 * linha de um COM rótulo (o seletor de DDI ao lado do telefone é o caso).
 *
 * É 20px do `text-sm` mais 6px do `gap-1.5` do campo. Estava cravado como `mt-7` (28px) na
 * tela, e os 2px de diferença só apareceram quando a altura dos campos mudou — número mágico
 * não acompanha mudança. Daqui, acompanha.
 */
export const FIELD_LABEL_OFFSET = 'mt-[1.625rem]';

/**
 * A altura do degrau `control-lg` da régua (40px), para um BOTÃO que fica na mesma linha de um
 * campo — a mesma altura que o campo tem. Só os botões dessas linhas usam isto (ex.: "Salvar" e
 * "Cancelar" ao lado do nome do item em Configurações).
 */
export const FIELD_ROW_BUTTON = 'h-10';

/**
 * A mesma folga, mas só a partir de `sm` — para a fileira que empilha no celular, onde o
 * controle fica EMBAIXO do campo e não deve descer nada.
 *
 * Existe como constante própria, e não como `` `sm:${FIELD_LABEL_OFFSET}` ``: o Tailwind lê as
 * classes do código-fonte para gerar o CSS, e nome montado em tempo de execução ele não vê —
 * a folga simplesmente não existiria no build de produção.
 */
export const FIELD_LABEL_OFFSET_SM = 'sm:mt-[1.625rem]';

/**
 * A CAIXA DE UM CAMPO — fundo, borda, canto, altura e tamanho do texto.
 *
 * É a régua do template: `control-lg` (40px) e o raio de controle, os mesmos do `AzuosRichTextField`,
 * do `AzuosSelectField` e do `AzuosDatePicker`. Mora num lugar só porque os campos ficam LADO A
 * LADO na mesma grade do formulário, e caixa diferente é o que faz a fileira parecer torta.
 *
 * Quem desenha um GATILHO acrescenta `flex items-center`; quem desenha um `<input>` não precisa.
 * A cor da borda é de quem chama: `border-input` normal e, quando recusado, o fundo vermelho claro (`bg-destructive-soft`).
 */
export const FIELD_CONTROL_CLASS =
  'control-lg rounded-control bg-muted text-foreground w-full border text-sm transition-colors';

/**
 * O FUNDO DE QUEM ABRE UMA LISTA (select, combobox, campo com sugestões).
 *
 * No escuro, o select do shadcn ganha um véu claro (`bg-input/30`), e o campo de texto ao lado
 * não. Todo campo de escolher usa o mesmo véu, para "isto abre uma lista" ter uma cara só — e
 * não metade dos selects claros e metade escuros na mesma fileira.
 */
export const CHOICE_FILL_CLASS = 'dark:bg-input/30 dark:hover:bg-input/50';

/** O recusado vence o véu: sem isto, no escuro o vermelho claro some debaixo dele. */
export const CHOICE_ERROR_CLASS = 'border-border bg-destructive-soft dark:bg-destructive-soft';

export type AzuosRichTextFieldType = 'text' | 'email' | 'password' | 'date' | 'month' | 'tel';

export type AzuosRichTextFieldHint = { text: string; tone: 'neutral' | 'calculated' | 'error' };

export type AzuosRichTextFieldProps = {
  data: {
    label: string;
    name: string;
    value: string;
    placeholder?: string;
    autoComplete?: string;
    hint?: AzuosRichTextFieldHint | null;
    maxLength?: number;
    inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  };
  ui?: {
    type?: AzuosRichTextFieldType;
    className?: string;
    /**
     * Um ícone DENTRO do campo, à esquerda — a lupa da busca. É desenho, não botão: a lista
     * filtra enquanto se digita, e um botão prometeria um clique que não muda nada.
     */
    icon?: LucideIcon;
  };
  state?: {
    error?: string | null;
    isDisabled?: boolean;
    isAutoFocused?: boolean;
    /** Mostra o asterisco e avisa o leitor de tela. Quem RECUSA o vazio é o schema. */
    isRequired?: boolean;
  };
  actions?: {
    onChange?: (value: string) => void;
    onBlur?: () => void;
    /**
     * O Enter do campo de busca — e o clique na lupa, que vira botão quando isto existe.
     *
     * A lista já filtra a cada tecla; o Enter é o gesto de quem terminou de digitar: ele leva
     * os olhos para o resultado, que numa tela comprida está abaixo da dobra.
     */
    onSubmit?: () => void;
  };
};

export function AzuosRichTextField({ data, ui, state, actions }: AzuosRichTextFieldProps) {
  /* `useState` de estado puramente visual e `useId` são o que a seção 3 do CONTRIBUTING
     permite dentro de um componente de UI. Nada aqui busca dado. */
  const [isRevealed, setIsRevealed] = useState(false);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  /* Os padrões são resolvidos em funções à parte, e não aqui: é o que mantém este
     componente legível como composição, em vez de uma lista de `??` antes do JSX. */
  const { type, className } = resolveUi(ui);
  const { error, isDisabled, isAutoFocused, isRequired } = resolveState(state);
  const { onChange, onBlur } = resolveActions(actions);
  const onSubmit = actions?.onSubmit;

  const isPassword = type === 'password';
  const Icon = ui?.icon;
  const hasError = Boolean(error);
  const hint = hasError ? null : (data.hint ?? null);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <FieldLabel data={{ htmlFor: inputId, label: data.label }} state={{ isRequired }} />

      <div className="relative">
        {Icon ? <FieldIcon icon={Icon} actions={{ onSubmit }} /> : null}
        <input
          id={inputId}
          name={data.name}
          type={resolveInputType(type, isRevealed)}
          value={data.value}
          placeholder={data.placeholder}
          autoComplete={data.autoComplete}
          maxLength={data.maxLength}
          inputMode={data.inputMode}
          autoFocus={isAutoFocused}
          disabled={isDisabled}
          required={isRequired}
          /* `aria-invalid` e `aria-describedby` são o que faz o leitor de tela anunciar o
             erro. Sem eles a mensagem existe na tela e não existe para quem não a vê. */
          aria-invalid={hasError}
          aria-describedby={describedBy({ hasError, errorId, hasHint: Boolean(hint), hintId })}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur()}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || !onSubmit) return;
            /* Sem o `preventDefault` o Enter mandaria o formulário em volta, se houver um. */
            event.preventDefault();
            onSubmit();
          }}
          className={inputClassName({ isPassword, hasError, hasIcon: Boolean(Icon) })}
        />

        {isPassword ? (
          <RevealButton
            state={{ isRevealed }}
            actions={{ onToggle: () => setIsRevealed((current) => !current) }}
          />
        ) : null}
      </div>

      {hasError ? <FieldError data={{ id: errorId, message: error ?? '' }} /> : null}
      {hint ? <FieldHint data={{ id: hintId, hint }} /> : null}
    </div>
  );
}

/**
 * O ícone dentro do campo. Com `onSubmit`, ele é um BOTÃO de pesquisar; sem, é só desenho —
 * ícone clicável que não faz nada é pior do que ícone nenhum.
 */
function FieldIcon({
  icon: Icon,
  actions,
}: {
  icon: LucideIcon;
  actions: { onSubmit?: () => void };
}) {
  const place = 'text-ink-500 absolute top-1/2 left-3 size-4 -translate-y-1/2';

  if (!actions.onSubmit)
    return <Icon aria-hidden="true" className={cn(place, 'pointer-events-none')} />;

  return (
    <button
      type="button"
      aria-label="Pesquisar"
      title="Pesquisar"
      onClick={actions.onSubmit}
      className={cn(
        place,
        'hover:text-ink-700 focus-visible:ring-brand-blue-700 rounded-chip cursor-pointer focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

/** O rótulo com o asterisco de obrigatório. Exportado para os outros campos usarem o mesmo. */
export function FieldLabel({
  data,
  state,
}: {
  data: { htmlFor: string; label: string };
  state?: { isRequired?: boolean };
}) {
  return (
    <label htmlFor={data.htmlFor} className="text-ink-700 text-sm font-medium">
      {data.label}
      {state?.isRequired ? (
        <span className="text-destructive" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </label>
  );
}

function resolveUi(ui: AzuosRichTextFieldProps['ui']) {
  return { type: ui?.type ?? 'text', className: ui?.className };
}

function resolveState(state: AzuosRichTextFieldProps['state']) {
  return {
    error: state?.error ?? null,
    isDisabled: state?.isDisabled ?? false,
    isAutoFocused: state?.isAutoFocused ?? false,
    isRequired: state?.isRequired ?? false,
  };
}

function resolveActions(actions: AzuosRichTextFieldProps['actions']) {
  return { onChange: actions?.onChange ?? noop, onBlur: actions?.onBlur ?? noop };
}

function describedBy(input: {
  hasError: boolean;
  errorId: string;
  hasHint: boolean;
  hintId: string;
}): string | undefined {
  if (input.hasError) return input.errorId;
  if (input.hasHint) return input.hintId;

  return undefined;
}

/**
 * Revelar troca o `type`, e não um CSS: com `-webkit-text-security` o gerenciador de senhas
 * do navegador deixa de reconhecer o campo.
 */
function resolveInputType(
  type: AzuosRichTextFieldType,
  isRevealed: boolean,
): AzuosRichTextFieldType {
  if (type !== 'password') return type;

  return isRevealed ? 'text' : 'password';
}

function inputClassName({
  isPassword,
  hasError,
  hasIcon,
}: {
  isPassword: boolean;
  hasError: boolean;
  hasIcon: boolean;
}): string {
  return cn(
    FIELD_CONTROL_CLASS,
    'placeholder:text-ink-500 disabled:cursor-not-allowed disabled:opacity-60',
    isPassword && 'pr-11',
    hasIcon && 'pl-9',
    hasError ? 'border-border bg-destructive-soft' : 'border-input',
  );
}

/**
 * `tabIndex={-1}` de propósito: no teclado, a tecla seguinte à senha precisa ser o botão de
 * entrar. Parar num olho no meio do caminho atrapalha quem opera sem mouse o dia inteiro.
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
export function FieldError({ data }: { data: { id: string; message: string } }) {
  return (
    <p id={data.id} role="alert" className="text-destructive text-xs font-medium">
      {data.message}
    </p>
  );
}

const HINT_TONES: Record<AzuosRichTextFieldHint['tone'], string> = {
  neutral: 'text-ink-500',
  calculated: 'text-brand-blue-800 dark:text-foreground',
  error: 'text-warning',
};

/**
 * A dica em tom de erro é ÂMBAR, e não vermelha: ela avisa ("não entendi a duração"), mas não
 * trava o envio. Vermelho é reservado ao que o formulário recusa.
 */
export function FieldHint({ data }: { data: { id: string; hint: AzuosRichTextFieldHint } }) {
  return (
    <p
      id={data.id}
      aria-live="polite"
      className={cn('text-xs font-medium', HINT_TONES[data.hint.tone])}
    >
      {data.hint.text}
    </p>
  );
}

function noop(): void {}
