import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosFormComboboxField } from './azuos-form-combobox-field.component';

const jobTitles = [
  { value: '', label: 'Nenhum' },
  { value: 'Analista', label: 'Analista' },
  { value: 'Supervisor', label: 'Supervisor' },
];

/* `fireEvent`, e não `userEvent`: a lista abre num portal do Radix, e o jsdom não calcula a
   geometria que o `userEvent` espera para considerá-la visível. */
describe('AzuosFormComboboxField', () => {
  // feliz
  it('names the trigger by the label and shows the selected option', () => {
    render(
      <AzuosFormComboboxField
        data={{ label: 'Cargo', value: 'Analista', options: jobTitles }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Cargo' })).toHaveTextContent('Analista');
  });

  // feliz
  it('searches, chooses and closes the edit with onBlur', async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <AzuosFormComboboxField
        data={{ label: 'Cargo', value: '', options: jobTitles }}
        actions={{ onChange, onBlur }}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Cargo' }));
    fireEvent.change(screen.getByPlaceholderText('Pesquisar…'), { target: { value: 'super' } });
    fireEvent.click(await screen.findByRole('option', { name: /Supervisor/ }));

    expect(onChange).toHaveBeenCalledWith('Supervisor');
    expect(onBlur).toHaveBeenCalled();
  });

  // triste
  it('shows the error instead of the hint, as an alert', () => {
    render(
      <AzuosFormComboboxField
        data={{ label: 'Cargo', value: '', options: jobTitles, hint: 'Lista do RH' }}
        state={{ error: 'O cargo pode ter no máximo 120 caracteres' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('O cargo pode ter no máximo 120');
    expect(screen.queryByText('Lista do RH')).not.toBeInTheDocument();
  });

  // triste
  it('keeps the trigger disabled and explains why', () => {
    render(
      <AzuosFormComboboxField
        data={{
          label: 'Departamento',
          value: 'Fiscal',
          options: [{ value: 'Fiscal', label: 'Fiscal' }],
          hint: 'Não consegui carregar a lista do RH.',
        }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Departamento' })).toBeDisabled();
    expect(screen.getByText('Não consegui carregar a lista do RH.')).toBeInTheDocument();
  });
});

describe('AzuosFormComboboxField without a visible label', () => {
  // feliz
  it('names the field by the aria label and marks it as required when asked', () => {
    render(
      <AzuosFormComboboxField
        data={{ value: '', options: [{ value: '55', label: 'Brasil (+55)' }] }}
        ui={{ ariaLabel: 'País do telefone' }}
        state={{ isRequired: true }}
        actions={{ onChange: () => undefined }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'País do telefone' })).toBeInTheDocument();
  });
});

describe('AzuosFormComboboxField error', () => {
  // triste
  it('marks the field invalid and points the screen reader to the error', () => {
    render(
      <AzuosFormComboboxField
        data={{ label: 'Colaborador', value: '', options: [] }}
        state={{ error: 'Escolha o colaborador' }}
        actions={{ onChange: () => undefined }}
      />,
    );

    const field = screen.getByRole('combobox', { name: 'Colaborador' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
  });
});
