import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosActionButton } from './azuos-action-button.component';

describe('AzuosActionButton', () => {
  // feliz
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AzuosActionButton data={{ label: 'Salvar' }} actions={{ onClick }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps the name for screen readers when only the icon shows', () => {
    render(
      <AzuosActionButton
        data={{ label: 'Excluir tarefa' }}
        ui={{ icon: Trash2, isIconOnly: true }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Excluir tarefa' })).toBeInTheDocument();
    expect(screen.queryByText('Excluir tarefa')).not.toBeInTheDocument();
  });

  // triste
  /* Dois cliques em "Excluir" seriam duas requisições. */
  it('locks while loading and shows the loading label', async () => {
    const onClick = vi.fn();
    render(
      <AzuosActionButton
        data={{ label: 'Excluir', loadingLabel: 'Excluindo…' }}
        state={{ isLoading: true }}
        actions={{ onClick }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Excluindo…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <AzuosActionButton
        data={{ label: 'Salvar' }}
        state={{ isDisabled: true }}
        actions={{ onClick }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  /* `type="button"` impede que um botão dentro de formulário o envie sem querer. */
  it('never submits a form by accident', () => {
    render(<AzuosActionButton data={{ label: 'Cancelar' }} />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
  });
});
