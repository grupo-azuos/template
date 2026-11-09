import { cn } from '../../utils/cn.util';
import {
  AzuosSelectField,
  type AzuosSelectFieldOption,
} from '../azuos-select-field/azuos-select-field.component';

export type AzuosFormSelectFieldOption = AzuosSelectFieldOption;

export type AzuosFormSelectFieldProps = {
  data: {
    label: string;
    value: string;
    options: AzuosFormSelectFieldOption[];
    /* Aparece embaixo do campo e no `title`: é o porquê de ele estar desabilitado. */
    hint?: string;
  };
  ui?: { isLabelHidden?: boolean; className?: string };
  state?: { isDisabled?: boolean; error?: string | null; isRequired?: boolean };
  actions?: { onChange?: (value: string) => void };
};

/**
 * O select do template (`AzuosSelectField`) com rótulo, dica e mensagem de erro — o que um
 * formulário precisa e o do template, feito para filtro, não traz.
 *
 * É ESTE sistema que precisa dele, não o template: aqui o papel, o nível de acesso e o sistema
 * são campos de formulário que mostram "Gestor só libera o nível Usuário" embaixo. Por isso
 * mora em arquivo próprio, com nome que não colide com o do template, e por baixo só compõe o
 * `AzuosSelectField` — altura (`control-lg`), raio e lista vêm dele.
 *
 * O rótulo pode ficar só para leitor de tela (`isLabelHidden`): numa linha de tabela a coluna
 * já diz o que é, e um rótulo visível em cada linha repetiria "Papel" cinquenta vezes.
 */
export function AzuosFormSelectField({ data, ui, state, actions }: AzuosFormSelectFieldProps) {
  const { error, message, isLabelHidden, isDisabled } = resolveField(data, ui, state);

  return (
    <div className={cn('flex min-w-40 flex-col gap-1.5', ui?.className)} title={data.hint}>
      <span className={cn('text-sm font-medium text-ink-700', isLabelHidden && 'sr-only')}>
        {data.label}
        {/* O `*` é desenho: o leitor de tela já ouve "obrigatório" pelo contexto do formulário. */}
        {state?.isRequired ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <AzuosSelectField
        data={{ value: data.value, options: data.options }}
        ui={{
          ariaLabel: data.label,
          className: cn('w-full', error !== null && 'border-border bg-destructive-soft'),
        }}
        state={{ isDisabled }}
        actions={{ onChange: (value) => actions?.onChange?.(value) }}
      />
      {message ? (
        <FieldMessage
          data={{ message }}
          ui={{ isHidden: isLabelHidden }}
          state={{ isError: error !== null }}
        />
      ) : null}
    </div>
  );
}

/** O erro vence a dica: quem errou precisa ler o erro, não o motivo de o campo existir. */
function resolveField(
  data: AzuosFormSelectFieldProps['data'],
  ui: AzuosFormSelectFieldProps['ui'],
  state: AzuosFormSelectFieldProps['state'],
) {
  const error = state?.error ?? null;

  return {
    error,
    message: error ?? data.hint ?? null,
    isLabelHidden: ui?.isLabelHidden ?? false,
    isDisabled: state?.isDisabled ?? false,
  };
}

/**
 * Com o rótulo escondido, a descrição também fica só para leitor de tela: numa linha de
 * tabela o motivo já está no `title`, e um texto embaixo de cada select dobraria a altura
 * da linha.
 */
function FieldMessage({
  data,
  ui,
  state,
}: {
  data: { message: string };
  ui: { isHidden: boolean };
  state: { isError: boolean };
}) {
  return (
    <p
      role={state.isError ? 'alert' : undefined}
      className={cn(
        'text-xs',
        state.isError ? 'font-medium text-destructive' : 'text-ink-500',
        ui.isHidden && 'sr-only',
      )}
    >
      {data.message}
    </p>
  );
}
