import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosDateField } from './azuos-date-field.component';

function field() {
  return screen.getByRole('textbox', { name: /Data de nascimento/ });
}

function type(text: string) {
  fireEvent.change(field(), { target: { value: text } });
}

/* `fireEvent`, não `userEvent`, para abrir o balão: o jsdom não calcula layout, e o `userEvent`
   no Popover do Radix fica preso esperando um estado de "visível" que nunca chega. */
function openCalendar() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Escolher Data de nascimento no calendário' }),
  );
}

function renderField(props: Partial<Parameters<typeof AzuosDateField>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <AzuosDateField
      data={{ label: 'Data de nascimento', name: 'birthDate', value: null }}
      actions={{ onChange }}
      {...props}
    />,
  );

  return { onChange };
}

describe('AzuosDateField', () => {
  // feliz
  it('shows the date as day/month/year', () => {
    renderField({ data: { label: 'Data de nascimento', name: 'birthDate', value: '1990-03-25' } });

    expect(field()).toHaveValue('25/03/1990');
  });

  // feliz
  it('puts the slashes in and returns the ISO date once it is complete', () => {
    const { onChange } = renderField();

    type('2503');
    expect(field()).toHaveValue('25/03');
    expect(onChange).not.toHaveBeenCalled();

    type('25031990');
    expect(field()).toHaveValue('25/03/1990');
    expect(onChange).toHaveBeenCalledWith('1990-03-25');
  });

  // feliz
  it('returns nothing when the field is emptied', () => {
    const { onChange } = renderField({
      data: { label: 'Data de nascimento', name: 'birthDate', value: '1990-03-25' },
    });

    type('');

    expect(onChange).toHaveBeenCalledWith(null);
  });

  // feliz
  /* O calendário começa pelo ano: é o que impede escolher o dia com o ano de hoje. */
  it('asks year, month and day in the calendar and returns the ISO date', () => {
    const { onChange } = renderField();

    openCalendar();
    expect(screen.getByText('Qual é o ano?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '1990' }));
    fireEvent.click(screen.getByRole('button', { name: 'Março' }));
    fireEvent.click(screen.getByRole('button', { name: '25' }));

    expect(onChange).toHaveBeenCalledWith('1990-03-25');
    expect(screen.queryByText('Qual é o dia?')).not.toBeInTheDocument();
  });

  // feliz
  it('sends the ISO date in the form field, under the given name', () => {
    const { container } = render(
      <AzuosDateField
        data={{ label: 'Data de nascimento', name: 'birthDate', value: '1990-03-25' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(container.querySelector('input[name="birthDate"]')).toHaveValue('1990-03-25');
  });

  // feliz
  it('hides the label from view but keeps it for the screen reader', () => {
    renderField({ ui: { isLabelHidden: true } });

    expect(field()).toBeInTheDocument();
    expect(screen.getByText('Data de nascimento')).toHaveClass('sr-only');
  });

  // triste
  /* O aviso só vem ao sair do campo: avisar a cada tecla acusaria quem ainda está digitando. */
  it('warns about an incomplete date only when the person leaves the field', () => {
    const { onChange } = renderField();

    type('2503');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.blur(field());

    expect(screen.getByRole('alert')).toHaveTextContent('Data inválida');
    expect(field()).toHaveValue('25/03');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('refuses a day that does not exist', () => {
    const { onChange } = renderField();

    type('31022026');
    fireEvent.blur(field());

    expect(screen.getByRole('alert')).toHaveTextContent('Data inválida');
    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('refuses a typed date outside the limit and explains the limit', () => {
    const { onChange } = renderField({
      data: { label: 'Data de nascimento', name: 'birthDate', value: null, max: '2026-10-11' },
    });

    type('01012030');
    fireEvent.blur(field());

    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma data até 11/10/2026.');
    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('clears the warning as soon as the person types again', () => {
    renderField();

    type('2503');
    fireEvent.blur(field());
    type('25031');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // triste
  it('shows the error that comes from outside', () => {
    renderField({ state: { error: 'Informe a data de nascimento.' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Informe a data de nascimento.');
  });

  // triste
  it('locks the field and the calendar button when disabled', () => {
    renderField({ state: { isDisabled: true } });

    expect(field()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Escolher Data de nascimento no calendário' }),
    ).toBeDisabled();
  });
});
