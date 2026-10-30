import { type Meta, type StoryObj } from '@storybook/react';
import { AzuosOtpField } from './azuos-otp-field.component';

const ACCESS_CODE_LENGTH = 6;

const meta = {
  title: 'Importados/AzuosOtpField',
  component: AzuosOtpField,
} satisfies Meta<typeof AzuosOtpField>;

export default meta;

type Story = StoryObj<typeof meta>;

const base = { label: 'Código de acesso', value: '', length: ACCESS_CODE_LENGTH };

export const Default: Story = {
  args: { data: base },
};

export const PartiallyFilled: Story = {
  args: { data: { ...base, value: '123' } },
};

export const Complete: Story = {
  args: { data: { ...base, value: '123456' } },
};

/**
 * O estado que mais aparece em produção: o código foi digitado errado, ou venceu enquanto a
 * pessoa procurava o e-mail.
 */
export const WithError: Story = {
  args: {
    data: { ...base, value: '123456' },
    state: { error: 'Código inválido ou vencido. Peça um novo para continuar' },
  },
};

/** Enquanto o código é conferido, as caixas param — dois envios do mesmo código não ajudam. */
export const Disabled: Story = {
  args: { data: { ...base, value: '123456' }, state: { isDisabled: true } },
};

/**
 * Caso limite: a coluna do formulário no celular mais estreito. As seis caixas precisam
 * caber sem empurrar a tela para o lado.
 */
export const InNarrowColumn: Story = {
  args: { data: { ...base, value: '12' } },
  render: (args) => (
    <div className="border-ink-300 w-64 border border-dashed p-2">
      <AzuosOtpField {...args} />
    </div>
  ),
};

/** Caso limite: um código de oito, para conferir que o tamanho não está escrito no componente. */
export const LongerCode: Story = {
  args: { data: { label: 'Código de acesso', value: '1234', length: 8 } },
};
