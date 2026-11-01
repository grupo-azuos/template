import { useId } from 'react';
import { cn } from '../../utils/cn.util';
import {
  AzuosComboboxField,
  type AzuosComboboxFieldOption,
} from '../azuos-combobox-field/azuos-combobox-field.component';

export type AzuosFormComboboxFieldOption = AzuosComboboxFieldOption;

export type AzuosFormComboboxFieldProps = {
  data: {
    /** Sem rótulo visível (o campo ao lado já diz o que é), o nome vai em `ui.ariaLabel`. */
    label?: string;
    value: string;
    options: AzuosFormComboboxFieldOption[];
    /* Aparece embaixo do campo: o porquê de a lista estar curta, ou de o campo estar travado. */
    hint?: string | null;
  };
  ui?: {
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    ariaLabel?: string;
    className?: string;
  };
  state?: { isDisabled?: boolean; error?: string | null; isRequired?: boolean };
  actions: { onChange: (value: string) => void; onBlur?: () => void };
};

/**
 * O campo com pesquisa do template (`AzuosComboboxField`) com rótulo, dica e mensagem de erro — o
 * mesmo que o `AzuosFormSelectField` faz pelo select, para formulário.
 *
 * Existe para cargo e departamento: as listas vêm do RH e têm dezenas de itens, e rolar até achar
 * não é viável. Por baixo só compõe o `AzuosComboboxField` — altura (`control-lg`), raio e lista
 * vêm dele; aqui entram só o rótulo e a mensagem.
 *
 * O `onBlur` é chamado ao escolher, e não ao sair do gatilho: num campo de lista a escolha É o
 * fim da edição, e validar ao perder o foco validaria o valor antigo enquanto a lista abre.
 */
export function AzuosFormComboboxField({ data, ui, state, actions }: AzuosFormComboboxFieldProps) {
  const { error, message } = resolveMessage(data, state);
  const messageId = useId();

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', ui?.className)}>
      {data.label ? (
        <FieldLabel data={{ label: data.label }} state={{ isRequired: state?.isRequired }} />
      ) : null}
      <AzuosComboboxField
        data={{ value: data.value, options: data.options }}
        ui={{
          ...resolveListTexts(ui),
          ariaLabel: data.label ?? ui?.ariaLabel,
          describedBy: message ? messageId : undefined,
          className: cn(error !== null && 'border-border bg-destructive-soft'),
        }}
        state={{ isDisabled: state?.isDisabled, isInvalid: error !== null }}
        actions={{
          onChange: (value) => {
            actions.onChange(value);
            actions.onBlur?.();
          },
        }}
      />
      {message ? (
        <FieldMessage data={{ id: messageId, message }} state={{ isError: error !== null }} />
      ) : null}
    </div>
  );
}

/** O erro vence a dica: quem errou precisa ler o erro, não o motivo de a lista estar curta. */
function resolveMessage(
  data: AzuosFormComboboxFieldProps['data'],
  state: AzuosFormComboboxFieldProps['state'],
) {
  const error = state?.error ?? null;

  return { error, message: error ?? data.hint ?? null };
}

function resolveListTexts(ui: AzuosFormComboboxFieldProps['ui']) {
  return {
    placeholder: ui?.placeholder ?? 'Selecione…',
    searchPlaceholder: ui?.searchPlaceholder,
    emptyLabel: ui?.emptyLabel,
  };
}

/** O `*` é desenho: o leitor de tela ouve "obrigatório" pelo contexto do formulário. */
function FieldLabel({ data, state }: { data: { label: string }; state: { isRequired?: boolean } }) {
  return (
    <span className="text-ink-700 text-sm font-medium">
      {data.label}
      {state.isRequired ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </span>
  );
}

function FieldMessage({
  data,
  state,
}: {
  data: { id: string; message: string };
  state: { isError: boolean };
}) {
  return (
    <p
      id={data.id}
      role={state.isError ? 'alert' : undefined}
      className={cn('text-xs', state.isError ? 'text-destructive font-medium' : 'text-ink-500')}
    >
      {data.message}
    </p>
  );
}
