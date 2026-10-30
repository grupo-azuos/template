import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosRichTextField } from './azuos-rich-text-field.component';

const meta = {
  title: 'Importados/AzuosRichTextField',
  component: AzuosRichTextField,
} satisfies Meta<typeof AzuosRichTextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { label: 'E-mail', name: 'email', value: '', placeholder: 'voce@empresa.com.br' },
    ui: { type: 'email' },
  },
};

export const Filled: Story = {
  args: {
    data: { label: 'E-mail', name: 'email', value: 'ana@empresa.com.br' },
    ui: { type: 'email' },
  },
};

/** Senha traz o botão de revelar — o resto do campo é o mesmo. */
export const Password: Story = {
  args: {
    data: { label: 'Senha', name: 'password', value: 'senha-secreta' },
    ui: { type: 'password' },
  },
};

/**
 * O estado que mais aparece em produção e menos aparece em desenvolvimento: quem programa
 * digita a senha certa; quem usa, não.
 */
export const WithError: Story = {
  args: {
    data: { label: 'E-mail', name: 'email', value: 'leyla' },
    ui: { type: 'email' },
    state: { error: 'Esse e-mail não parece válido' },
  },
};

export const Disabled: Story = {
  args: {
    data: { label: 'E-mail', name: 'email', value: 'ana@empresa.com.br' },
    ui: { type: 'email' },
    state: { isDisabled: true },
  },
};

/** Caso limite: mensagem de erro que quebra em duas linhas dentro de uma coluna estreita. */
export const LongErrorInNarrowColumn: Story = {
  args: {
    data: { label: 'Senha', name: 'password', value: 'curta' },
    ui: { type: 'password' },
    state: { error: 'A senha precisa ter ao menos 8 caracteres' },
  },
  render: (args) => (
    <div className="border-ink-300 w-56 border border-dashed p-2">
      <AzuosRichTextField {...args} />
    </div>
  ),
};

/** Obrigatório: o asterisco no rótulo. */
export const Required: Story = {
  args: {
    data: { label: 'Nome completo', name: 'name', value: '' },
    state: { isRequired: true },
  },
};

/** Data: o seletor do próprio navegador. */
export const DateType: Story = {
  args: {
    data: { label: 'Data de admissão', name: 'admissionDate', value: '2026-04-07' },
    ui: { type: 'date' },
  },
};

/** Mês: o seletor de mês e ano do navegador, para filtrar um calendário. */
export const MonthType: Story = {
  args: {
    data: { label: 'Mês do calendário', name: 'month', value: '2026-12' },
    ui: { type: 'month' },
  },
};

/** A dica de onde o valor veio, nos três tons. */
export const WithCalculatedHint: Story = {
  args: {
    data: {
      label: 'Vencimento',
      name: 'probation1End',
      value: '2026-05-21',
      hint: { text: 'Calculado: 45 dias a partir do início.', tone: 'calculated' },
    },
    ui: { type: 'date' },
  },
};

export const WithWarningHint: Story = {
  args: {
    data: {
      label: 'Duração',
      name: 'probation1Duration',
      value: '30 horas',
      hint: { text: 'Não entendi. Use algo como 30 dias, 45 dias ou 2 meses.', tone: 'error' },
    },
  },
};
