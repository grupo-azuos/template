import { CalendarIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { cn } from '../../utils/cn.util';
import {
  displayFromIso,
  isIsoWithin,
  isoFromDisplay,
  maskDateInput,
  rangeHint,
} from '../../utils/date-input.util';
import { AzuosDateStepper } from '../azuos-date-stepper/azuos-date-stepper.component';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * O campo de UMA data: a pessoa DIGITA `dd/mm/aaaa` ou toca no calendário, que pergunta o ano,
 * depois o mês, depois o dia (`AzuosDateStepper`).
 *
 * Os dois caminhos existem porque servem a pessoas diferentes. Quem sabe a data de cor digita
 * oito números e as barras entram sozinhas — é o mais rápido para data de nascimento. Quem
 * prefere escolher não cai num calendário aberto no mês de hoje, onde é fácil marcar o dia e
 * esquecer de trocar o ano: o calendário aqui começa perguntando o ano.
 *
 * O VALOR ENTRA E SAI COMO TEXTO ISO (`1990-03-25`), igual ao `AzuosDatePicker` — trocar um pelo
 * outro numa tela não muda o que o formulário envia. O campo escondido leva o ISO no `name`; o
 * campo que se vê não tem `name`, para o formulário nativo não enviar a data duas vezes em dois
 * formatos.
 *
 * Enquanto a pessoa digita, o texto é dela: a data só é entregue quando fica completa e válida, e
 * o aviso de data inválida só aparece ao sair do campo — avisar a cada tecla seria acusar de erro
 * quem ainda está no meio do número.
 */
export type AzuosDateFieldProps = {
  data: {
    label: string;
    name: string;
    /** A data em ISO (`1990-03-25`), ou vazio quando ninguém informou. */
    value: string | null;
    /** A primeira data aceita, em ISO. */
    min?: string;
    /** A última data aceita, em ISO. Para data de nascimento, o dia de hoje. */
    max?: string;
    /** Pinta um `*` vermelho depois do rótulo — ver `AzuosTextField`. */
    isRequired?: boolean;
  };
  ui?: {
    /** O ano em que o calendário abre quando o campo está vazio. Ver `AzuosDateStepper`. */
    startYear?: number;
    className?: string;
    /** Esconde o rótulo da vista, mas não do leitor de tela — para campo que já tem o rótulo ao
        lado, como o "desde" de uma lista. */
    isLabelHidden?: boolean;
  };
  state?: { error?: string | null; isDisabled?: boolean };
  actions: { onChange: (value: string | null) => void; onBlur?: () => void };
};

const INVALID_DATE = 'Data inválida. Digite o dia, o mês e o ano, como 25/03/1990.';

/** O que há de errado com o texto digitado — ou nada, se está vazio ou é uma data aceita. */
function typedProblem(text: string | null, min?: string, max?: string): string | null {
  if (!text) return null;

  const iso = isoFromDisplay(text);
  if (!iso) return INVALID_DATE;
  if (!isIsoWithin(iso, min, max)) return rangeHint(min, max);

  return null;
}

function resolveState(state: AzuosDateFieldProps['state']) {
  return { externalError: state?.error ?? null, isDisabled: state?.isDisabled ?? false };
}

function resolveCompletedIso(text: string, min?: string, max?: string): string | null {
  const iso = isoFromDisplay(text);
  if (iso && isIsoWithin(iso, min, max)) return iso;

  return null;
}

export function AzuosDateField({ data, ui, state, actions }: AzuosDateFieldProps) {
  const inputId = useId();
  const errorId = inputId + '-error';

  /* `draft` é o texto no meio da digitação. `null` quer dizer "ninguém está digitando": o campo
     mostra a data que veio de fora. */
  const [draft, setDraft] = useState<string | null>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { externalError, isDisabled } = resolveState(state);
  const error = externalError ?? typedError;
  const hasError = Boolean(error);

  const type = (raw: string) => {
    const text = maskDateInput(raw);
    setDraft(text);
    setTypedError(null);

    if (text === '') {
      actions.onChange(null);

      return;
    }

    const iso = resolveCompletedIso(text, data.min, data.max);
    if (iso) actions.onChange(iso);
  };

  const leave = () => {
    const problem = typedProblem(draft, data.min, data.max);
    setTypedError(problem);
    /* Com problema, o texto digitado fica no campo para a pessoa corrigir — apagá-lo esconderia
       justamente o que ela precisa ver. */
    if (!problem) setDraft(null);
    actions.onBlur?.();
  };

  const pick = (iso: string) => {
    actions.onChange(iso);
    setDraft(null);
    setTypedError(null);
    setIsOpen(false);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', ui?.className)}>
      <FieldLabel
        data={{ inputId, label: data.label, isRequired: data.isRequired }}
        ui={{ isHidden: ui?.isLabelHidden }}
      />

      <input type="hidden" name={data.name} value={data.value ?? ''} readOnly />

      {/* A régua de medidas (`lib/theme/tokens.css`), como no `AzuosInputGroup`: `px-0!` porque
          quem dá o respiro lateral aqui é o input de dentro e o botão do calendário. */}
      <InputGroup
        className={cn('control-lg rounded-control bg-card px-0!', hasError && 'border-destructive')}
      >
        <InputGroupInput
          id={inputId}
          className="text-foreground"
          /* `numeric`: no celular abre o teclado de números, que é só o que este campo aceita. */
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={draft ?? displayFromIso(data.value)}
          disabled={isDisabled}
          required={data.isRequired}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(event) => type(event.target.value)}
          onBlur={leave}
        />

        <CalendarButton
          data={{ ...data, startYear: ui?.startYear }}
          state={{ isOpen, isDisabled }}
          actions={{ onOpenChange: setIsOpen, onPick: pick }}
        />
      </InputGroup>

      <FieldError data={{ id: errorId, message: error }} />
    </div>
  );
}

function FieldLabel({
  data,
  ui,
}: {
  data: { inputId: string; label: string; isRequired?: boolean };
  ui: { isHidden?: boolean };
}) {
  return (
    <label
      htmlFor={data.inputId}
      className={cn('text-ink-700 text-sm font-medium', ui.isHidden && 'sr-only')}
    >
      {data.label}
      {data.isRequired ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldError({ data }: { data: { id: string; message: string | null } }) {
  if (!data.message) return null;

  return (
    <p id={data.id} role="alert" className="text-destructive text-xs font-medium">
      {data.message}
    </p>
  );
}

/** O botão colado no fim do campo e o balão com as três perguntas (ano, mês, dia). */
function CalendarButton({
  data,
  state,
  actions,
}: {
  data: { label: string; value: string | null; min?: string; max?: string; startYear?: number };
  state: { isOpen: boolean; isDisabled: boolean };
  actions: { onOpenChange: (isOpen: boolean) => void; onPick: (iso: string) => void };
}) {
  return (
    <InputGroupAddon align="inline-end">
      <Popover open={state.isOpen} onOpenChange={actions.onOpenChange}>
        <PopoverTrigger asChild>
          <InputGroupButton
            size="icon-sm"
            disabled={state.isDisabled}
            aria-label={`Escolher ${data.label} no calendário`}
            className="control-icon-sm rounded-chip text-ink-500 hover:text-ink-900"
          >
            <CalendarIcon aria-hidden="true" />
          </InputGroupButton>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="rounded-surface border-border bg-card w-auto p-0 shadow-xl"
        >
          <AzuosDateStepper
            data={{ value: data.value, min: data.min, max: data.max }}
            ui={{ startYear: data.startYear }}
            actions={{ onChange: actions.onPick }}
          />
        </PopoverContent>
      </Popover>
    </InputGroupAddon>
  );
}
