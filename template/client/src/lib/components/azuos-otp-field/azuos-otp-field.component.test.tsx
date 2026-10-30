import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosOtpField } from './azuos-otp-field.component';

const data = { label: 'Código de acesso', value: '', length: 6 };

function boxes(): HTMLInputElement[] {
  return screen.getAllByRole('textbox') as HTMLInputElement[];
}

describe('AzuosOtpField', () => {
  it('draws one box per digit of the code', () => {
    render(<AzuosOtpField data={data} />);

    expect(boxes()).toHaveLength(6);
  });

  it('shows the value it was given, one digit per box', () => {
    render(<AzuosOtpField data={{ ...data, value: '1234' }} />);

    expect(boxes().map((box) => box.value)).toEqual(['1', '2', '3', '4', '', '']);
  });

  it('reports the whole code, and not just the digit that was typed', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={{ ...data, value: '12' }} actions={{ onChange }} />);

    await userEvent.type(boxes()[2] as HTMLInputElement, '3');

    expect(onChange).toHaveBeenCalledWith('123');
  });

  /* O código chega do e-mail pela área de transferência, inteiro. Sem isto, colar preenche
     UMA caixa e a pessoa apaga tudo e digita à mão. */
  it('spreads a pasted code across the boxes', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={data} actions={{ onChange }} />);

    await userEvent.click(boxes()[0] as HTMLInputElement);
    await userEvent.paste('123456');

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('ignores what is not a digit in what was pasted', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={data} actions={{ onChange }} />);

    await userEvent.click(boxes()[0] as HTMLInputElement);
    await userEvent.paste('12 34-56');

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('throws away what does not fit instead of overflowing the last box', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={data} actions={{ onChange }} />);

    await userEvent.click(boxes()[0] as HTMLInputElement);
    await userEvent.paste('123456789');

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('says the code is complete once the last box is filled', async () => {
    const onComplete = vi.fn();
    render(<AzuosOtpField data={{ ...data, value: '12345' }} actions={{ onComplete }} />);

    await userEvent.type(boxes()[5] as HTMLInputElement, '6');

    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('does not call it complete while a box is still empty', async () => {
    const onComplete = vi.fn();
    render(<AzuosOtpField data={{ ...data, value: '12' }} actions={{ onComplete }} />);

    await userEvent.type(boxes()[2] as HTMLInputElement, '3');

    expect(onComplete).not.toHaveBeenCalled();
  });

  /* Sem isto a pessoa fica presa na última caixa apagando o nada, porque o cursor não volta
     sozinho. */
  it('erases the previous digit when backspace lands on an empty box', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={{ ...data, value: '123' }} actions={{ onChange }} />);

    await userEvent.click(boxes()[3] as HTMLInputElement);
    await userEvent.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('erases in place when backspace lands on a filled box', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={{ ...data, value: '123' }} actions={{ onChange }} />);

    await userEvent.click(boxes()[2] as HTMLInputElement);
    await userEvent.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('does nothing when backspace is pressed on an empty first box', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={data} actions={{ onChange }} />);

    await userEvent.click(boxes()[0] as HTMLInputElement);
    await userEvent.keyboard('{Backspace}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves between boxes with the arrow keys', async () => {
    render(<AzuosOtpField data={{ ...data, value: '123456' }} />);

    await userEvent.click(boxes()[3] as HTMLInputElement);
    await userEvent.keyboard('{ArrowLeft}');
    expect(boxes()[2]).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(boxes()[4]).toHaveFocus();
  });

  it('stays inside the field at both ends', async () => {
    render(<AzuosOtpField data={{ ...data, value: '123456' }} />);

    await userEvent.click(boxes()[0] as HTMLInputElement);
    await userEvent.keyboard('{ArrowLeft}');

    expect(boxes()[0]).toHaveFocus();
  });

  /* O autopreenchimento do sistema operacional entrega o código inteiro na primeira caixa, e
     só a procura se ela declarar `one-time-code`. */
  it('offers the one-time code autofill on the first box alone', () => {
    render(<AzuosOtpField data={data} />);

    expect(boxes()[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes()[1]).toHaveAttribute('autocomplete', 'off');
  });

  it('opens the numeric keypad on a phone', () => {
    render(<AzuosOtpField data={data} />);

    for (const box of boxes()) {
      expect(box).toHaveAttribute('inputmode', 'numeric');
    }
  });

  /* Sem o rótulo no grupo, o leitor de tela anuncia seis campos sem nome e a pessoa não sabe
     o que está preenchendo. */
  it('names the group and each box for assistive technology', () => {
    render(<AzuosOtpField data={data} />);

    expect(screen.getByRole('group', { name: 'Código de acesso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dígito 1 de 6')).toBeInTheDocument();
    expect(screen.getByLabelText('Dígito 6 de 6')).toBeInTheDocument();
  });

  it('announces the error and marks every box invalid', () => {
    render(<AzuosOtpField data={data} state={{ error: 'Código inválido ou vencido' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Código inválido ou vencido');
    expect(boxes()[0]).toHaveAttribute('aria-invalid', 'true');
    expect(boxes()[0]).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
  });

  it('does not describe the boxes by an error that is not there', () => {
    render(<AzuosOtpField data={data} />);

    expect(boxes()[0]).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stops accepting digits while the code is being checked', async () => {
    const onChange = vi.fn();
    render(<AzuosOtpField data={data} state={{ isDisabled: true }} actions={{ onChange }} />);

    await userEvent.type(boxes()[0] as HTMLInputElement, '1');

    expect(onChange).not.toHaveBeenCalled();
  });
});
