import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosTextField } from './azuos-text-field.component';

const meta = {
  title: 'Formulários/AzuosTextField',
  component: AzuosTextField,
} satisfies Meta<typeof AzuosTextField>;

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
      <AzuosTextField {...args} />
    </div>
  ),
};

/** Obrigatório: o `*` é só CSS, o rótulo continua limpo para o leitor de tela. */
export const Required: Story = {
  args: { data: { label: 'Título', name: 'title', value: '', isRequired: true } },
};

/** `date` entra como tipo, não como componente novo: só o `type` do input muda. */
export const DateType: Story = {
  args: { data: { label: 'Prazo', name: 'dueDate', value: '2026-10-20' }, ui: { type: 'date' } },
};

/**
 * Teclado numérico no celular SEM `type="number"` — que traz setinhas, aceita "e" e "-" e
 * esconde o que foi digitado errado.
 */
export const NumericKeyboard: Story = {
  args: {
    data: { label: 'Telefone', name: 'phone', value: '', placeholder: '(11) 90000-0000' },
    ui: { type: 'tel', inputMode: 'numeric' },
  },
};
