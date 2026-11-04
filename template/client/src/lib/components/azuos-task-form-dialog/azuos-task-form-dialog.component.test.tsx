import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosTaskFormDialog,
  type AzuosTaskFormDialogProps,
} from './azuos-task-form-dialog.component';

const fields = {
  title: { value: '', error: null },
  description: { value: '', error: null },
  status: { value: 'todo', error: null },
};

function renderForm(overrides: Partial<AzuosTaskFormDialogProps> = {}) {
  const actions = { onChange: vi.fn(), onBlur: vi.fn(), onSubmit: vi.fn(), onClose: vi.fn() };

  render(
    <AzuosTaskFormDialog
      data={{ mode: 'create', fields }}
      state={{ isOpen: true }}
      actions={actions}
      {...overrides}
    />,
  );

  return actions;
}

describe('AzuosTaskFormDialog', () => {
  // feliz
  it('reports what is typed in the title, naming the field', async () => {
    const actions = renderForm();

    await userEvent.type(screen.getByLabelText('Título'), 'a');

    expect(actions.onChange).toHaveBeenCalledWith('title', 'a');
  });

  it('submits through the form, so Enter works too', async () => {
    const actions = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(actions.onSubmit).toHaveBeenCalledOnce();
  });

  it('says it is editing when there is a task', () => {
    renderForm({ data: { mode: 'edit', fields } });

    expect(screen.getByRole('heading', { name: 'Editar tarefa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  // triste
  it('shows the field error next to the field', () => {
    renderForm({
      data: {
        mode: 'create',
        fields: { ...fields, title: { value: '', error: 'Informe o título' } },
      },
    });

    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Informe o título')).toBeInTheDocument();
  });

  it('keeps the server refusal inside the dialog', () => {
    renderForm({ state: { isOpen: true, error: 'Seu perfil é somente leitura.' } });

    expect(screen.getByText('Seu perfil é somente leitura.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  /* Dois cliques em "Criar" seriam duas tarefas iguais. */
  it('locks the submit button while saving', () => {
    renderForm({ state: { isOpen: true, isSubmitting: true } });

    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
  });

  it('reports the description and its blur, naming the field', async () => {
    const actions = renderForm();

    await userEvent.type(screen.getByLabelText('Descrição'), 'd');
    await userEvent.tab();

    expect(actions.onChange).toHaveBeenCalledWith('description', 'd');
    expect(actions.onBlur).toHaveBeenCalledWith('description');
  });

  it('reports the chosen situation, naming the field', async () => {
    const actions = renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: 'Situação' }));
    await userEvent.click(screen.getByRole('option', { name: 'Concluída' }));

    expect(actions.onChange).toHaveBeenCalledWith('status', 'done');
  });

  /* Fechar pelo Esc ou pelo fundo passa pelo mesmo `onClose` do botão Cancelar: a tela só tem um
     jeito de saber que o modal fechou. */
  it('closes through the same action when dismissed with Escape', async () => {
    const actions = renderForm();

    await userEvent.keyboard('{Escape}');

    expect(actions.onClose).toHaveBeenCalledOnce();
  });

  it('closes through the cancel button', async () => {
    const actions = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(actions.onClose).toHaveBeenCalledOnce();
    expect(actions.onSubmit).not.toHaveBeenCalled();
  });
});
