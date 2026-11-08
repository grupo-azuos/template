import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { type FieldMask } from '../../utils/field-mask.util';

import { AzuosMaskedTextField } from './azuos-masked-text-field.component';

function Controlled({ mask, initial = '' }: { mask: FieldMask; initial?: string }) {
  const [value, setValue] = useState(initial);

  return (
    <AzuosMaskedTextField
      data={{ label: 'Campo', name: 'campo', value }}
      ui={{ mask }}
      actions={{ onChange: setValue }}
    />
  );
}

describe('AzuosMaskedTextField', () => {
  it('formats external values and retains invalid saved content for correction', () => {
    const { rerender } = render(
      <AzuosMaskedTextField
        data={{ label: 'CIN', name: 'cin', value: '52998224725' }}
        ui={{ mask: 'cin' }}
        actions={{ onChange: vi.fn() }}
      />,
    );
    expect(screen.getByLabelText('CIN')).toHaveValue('529.982.247-25');
    rerender(
      <AzuosMaskedTextField
        data={{ label: 'CIN', name: 'cin', value: '529982247250' }}
        ui={{ mask: 'cin' }}
        actions={{ onChange: vi.fn() }}
      />,
    );
    expect(screen.getByLabelText('CIN')).toHaveValue('529982247250');
    fireEvent.blur(screen.getByLabelText('CIN'));
    expect(screen.getByRole('alert')).toHaveTextContent('A CIN usa os 11 números do CPF');
  });
  // feliz
  it('adds punctuation while typing or pasting', () => {
    render(<Controlled mask="cpf" />);
    const input = screen.getByLabelText('Campo');

    fireEvent.change(input, { target: { value: '52998224725' } });

    expect(input).toHaveValue('529.982.247-25');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // feliz
  it('types money right to left', () => {
    render(<Controlled mask="money" />);
    const input = screen.getByLabelText('Campo');

    fireEvent.change(input, { target: { value: '150000' } });

    expect(input).toHaveValue('1.500,00');
  });

  // triste
  it('flags an incomplete value only when the person leaves the field', () => {
    render(<Controlled mask="cep" />);
    const input = screen.getByLabelText('Campo');

    fireEvent.change(input, { target: { value: '7400' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.blur(input);
    expect(screen.getByRole('alert')).toHaveTextContent('O CEP tem 8 números');
  });

  // triste
  it('warns at once about a complete but wrong CPF', () => {
    render(<Controlled mask="cpf" />);

    fireEvent.change(screen.getByLabelText('Campo'), { target: { value: '52998224724' } });

    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido');
  });

  // triste
  it('lets the caller error beat the format error', () => {
    const onChange = vi.fn();
    render(
      <AzuosMaskedTextField
        data={{ label: 'CPF', name: 'cpf', value: '' }}
        ui={{ mask: 'cpf' }}
        state={{ error: 'Informe o CPF' }}
        actions={{ onChange }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o CPF');
  });
});
