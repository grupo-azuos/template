import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskStatus,
} from '@template/shared/domain/task-status.util';
import { DESCRIPTION_MAX_LENGTH } from '@template/shared/schemas/task.schema';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { type FormFieldState } from '../../types/form-field.type';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';
import { AzuosSelectField } from '../azuos-select-field/azuos-select-field.component';
import { AzuosSubmitButton } from '../azuos-submit-button/azuos-submit-button.component';
import { AzuosTextAreaField } from '../azuos-text-area-field/azuos-text-area-field.component';
import { AzuosTextField } from '../azuos-text-field/azuos-text-field.component';

export type AzuosTaskFormField = 'title' | 'description' | 'status';

/**
 * O formulário de criar/editar tarefa, num modal.
 *
 * Função pura de props: o valor e o erro de cada campo chegam prontos (`FormFieldState`), e
 * por isso o modal abre no Storybook preenchido, com erro ou enviando — sem servidor e sem
 * biblioteca de formulário no meio.
 *
 * A recusa do servidor aparece DENTRO do modal, e ele continua aberto: fechar jogaria fora o
 * que foi digitado, e a pessoa teria que preencher tudo de novo para ler o mesmo erro.
 */
export type AzuosTaskFormDialogProps = {
  data: {
    mode: 'create' | 'edit';
    fields: Record<AzuosTaskFormField, FormFieldState>;
  };
  state: { isOpen: boolean; isSubmitting?: boolean; error?: string | null };
  actions: {
    onChange: (field: AzuosTaskFormField, value: string) => void;
    onBlur: (field: AzuosTaskFormField) => void;
    onSubmit: () => void;
    onClose: () => void;
  };
};

const STATUS_OPTIONS = TASK_STATUSES.map((status: TaskStatus) => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
}));

export function AzuosTaskFormDialog({ data, state, actions }: AzuosTaskFormDialogProps) {
  const isEdit = data.mode === 'edit';
  const { fields } = data;

  return (
    <Dialog open={state.isOpen} onOpenChange={(isOpen) => (isOpen ? undefined : actions.onClose())}>
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            actions.onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Altere o que precisar e salve.' : 'Só o título é obrigatório.'}
            </DialogDescription>
          </DialogHeader>

          <AzuosTextField
            data={{
              label: 'Título',
              name: 'title',
              value: fields.title.value,
              placeholder: 'O que precisa ser feito?',
            }}
            state={{
              error: fields.title.error,
              isDisabled: state.isSubmitting,
              isAutoFocused: true,
            }}
            actions={{
              onChange: (value) => actions.onChange('title', value),
              onBlur: () => actions.onBlur('title'),
            }}
          />

          <AzuosTextAreaField
            data={{
              label: 'Descrição',
              name: 'description',
              value: fields.description.value,
              placeholder: 'Detalhes, se houver',
              maxLength: DESCRIPTION_MAX_LENGTH,
            }}
            state={{ error: fields.description.error, isDisabled: state.isSubmitting }}
            actions={{
              onChange: (value) => actions.onChange('description', value),
              onBlur: () => actions.onBlur('description'),
            }}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-ink-700 text-sm font-medium">Situação</span>
            <AzuosSelectField
              data={{ value: fields.status.value, options: STATUS_OPTIONS }}
              ui={{ ariaLabel: 'Situação' }}
              state={{ isDisabled: state.isSubmitting }}
              actions={{ onChange: (value) => actions.onChange('status', value) }}
            />
          </div>

          {state.error ? (
            <AzuosErrorState data={{ message: state.error }} ui={{ variant: 'inline' }} />
          ) : null}

          <DialogFooter>
            <AzuosActionButton
              data={{ label: 'Cancelar' }}
              ui={{ variant: 'secondary' }}
              state={{ isDisabled: state.isSubmitting }}
              actions={{ onClick: actions.onClose }}
            />
            <AzuosSubmitButton
              data={{ label: isEdit ? 'Salvar' : 'Criar tarefa', loadingLabel: 'Salvando…' }}
              ui={{ className: 'sm:w-auto' }}
              state={{ isLoading: state.isSubmitting }}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
