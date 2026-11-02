import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosDateRangeField,
  orderedRange,
  rangeLabel,
  type AzuosDateRange,
} from './azuos-date-range-field.component';

const EMPTY: AzuosDateRange = { from: null, to: null };
const MARCH: AzuosDateRange = { from: '2026-03-01', to: '2026-03-31' };

function renderField(
  value: AzuosDateRange = EMPTY,
  state?: { error?: string; isDisabled?: boolean },
) {
  const onChange = vi.fn();
  const { container } = render(
    <AzuosDateRangeField
      data={{ label: 'Período', name: 'period', value }}
      state={state}
      actions={{ onChange }}
    />,
  );

  return { onChange, container };
}

function trigger() {
  return screen.getByRole('button', { name: /Período/ });
}

/* `fireEvent`, não `userEvent`, para abrir o balão: o jsdom não calcula layout, e o `userEvent`
   no Popover do Radix fica preso esperando um estado de "visível" que nunca chega. */
function open() {
  fireEvent.click(trigger());
}

function type(label: string, text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value: text } });
}

describe('rangeLabel', () => {
  // feliz
  it('writes the period as day/month/year to day/month/year', () => {
    expect(rangeLabel(MARCH)).toBe('01/03/2026 até 31/03/2026');
  });

  // triste
  it('writes only the side that exists, and nothing when empty', () => {
    expect(rangeLabel({ from: '2026-03-01', to: null })).toBe('A partir de 01/03/2026');
    expect(rangeLabel({ from: null, to: '2026-03-31' })).toBe('Até 31/03/2026');
    expect(rangeLabel(EMPTY)).toBe('');
  });
});

describe('orderedRange', () => {
  // feliz
  it('keeps a period that is already in order', () => {
    expect(orderedRange(MARCH)).toEqual(MARCH);
  });

  // triste
  /* Quem digita o fim antes do começo disse as duas datas certas, só na ordem errada. */
  it('swaps the dates when the end comes before the start', () => {
    expect(orderedRange({ from: '2026-03-31', to: '2026-03-01' })).toEqual(MARCH);
  });
});

describe('AzuosDateRangeField', () => {
  // feliz
  it('shows the chosen period in the closed field', () => {
    renderField(MARCH);

    expect(trigger()).toHaveTextContent('01/03/2026 até 31/03/2026');
  });

  // feliz
  it('shows the placeholder while nothing is chosen', () => {
    renderField();

    expect(trigger()).toHaveTextContent('Selecione o período');
  });

  // feliz
  it('applies the two typed dates as ISO', () => {
    const { onChange } = renderField();

    open();
    type('De', '01032026');
    type('Até', '31032026');
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onChange).toHaveBeenCalledWith(MARCH);
  });

  // feliz
  it('puts the typed dates in order before applying', () => {
    const { onChange } = renderField();

    open();
    type('De', '31032026');
    type('Até', '01032026');
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onChange).toHaveBeenCalledWith(MARCH);
  });

  // feliz
  it('clears the period at once', () => {
    const { onChange } = renderField(MARCH);

    open();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(onChange).toHaveBeenCalledWith(EMPTY);
  });

  // feliz
  it('sends the two ISO dates in the form fields, under the given name', () => {
    const { container } = renderField(MARCH);

    expect(container.querySelector('input[name="periodFrom"]')).toHaveValue('2026-03-01');
    expect(container.querySelector('input[name="periodTo"]')).toHaveValue('2026-03-31');
  });

  // triste
  /* Com uma data só, a tela de trás não saberia se é "a partir de" ou "até". */
  it('does not let half a period be applied', () => {
    const { onChange } = renderField();

    open();
    type('De', '01032026');

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('delivers nothing while the person only types, before applying', () => {
    const { onChange } = renderField();

    open();
    type('De', '01032026');
    type('Até', '31032026');

    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('ignores a typed day that does not exist', () => {
    renderField();

    open();
    type('De', '31022026');
    type('Até', '31032026');

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  });

  // triste
  it('shows the error that comes from outside', () => {
    renderField(EMPTY, { error: 'Informe o período do relatório.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o período do relatório.');
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
  });

  // triste
  it('locks the field when disabled', () => {
    renderField(MARCH, { isDisabled: true });

    expect(trigger()).toBeDisabled();
  });

  // feliz
  /* O calendário é o segundo caminho para o mesmo rascunho: clicar dois dias monta o período, e
     ele só sai pelo "Aplicar", como o digitado. */
  it('completes the period by clicking a day on the calendar', () => {
    const { onChange } = renderField({ from: '2026-03-05', to: null });
    open();

    fireEvent.click(screen.getByRole('button', { name: /20 de março de 2026/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onChange).toHaveBeenCalledWith({ from: '2026-03-05', to: '2026-03-20' });
  });

  // triste
  /* Apagar o texto de uma ponta esvazia essa ponta no rascunho: o "Aplicar" volta a travar. */
  it('empties an edge when its text is erased', () => {
    renderField(MARCH);
    open();

    type('De', '');

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
    expect(screen.getByText('Escolha a data de início e a de fim.')).toBeInTheDocument();
  });

  /* Ao sair, o campo volta a mostrar a data que está valendo: texto pela metade some, em vez de
     ficar parecendo uma data aceita. */
  it('drops a half-typed date when the edge loses focus', () => {
    renderField(MARCH);
    open();
    const from = screen.getByRole('textbox', { name: 'De' });

    fireEvent.change(from, { target: { value: '15/0' } });
    expect(from).toHaveValue('15/0');

    fireEvent.blur(from);

    expect(from).toHaveValue('01/03/2026');
  });
});
