import { type Meta, type StoryObj } from '@storybook/react';

import { toPasswordStrength } from '../../view-models/password-strength.util';
import { AzuosPasswordStrengthMeter } from './azuos-password-strength-meter.component';

const meta = {
  title: 'Formulários/AzuosPasswordStrengthMeter',
  component: AzuosPasswordStrengthMeter,
} satisfies Meta<typeof AzuosPasswordStrengthMeter>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * As senhas destas stories são EXEMPLOS, e não segredo de ninguém: elas existem para desenhar
 * a barra em cada nível. A regra do CONTRIBUTING §4 — senha não entra em `data` de story —
 * vale para senha de verdade; aqui o que entra é o resultado da conta, já calculado.
 */
export const Empty: Story = {
  args: { data: { strength: toPasswordStrength('') } },
};

export const Weak: Story = {
  args: { data: { strength: toPasswordStrength('abacaxicomcaju') } },
};

export const Fair: Story = {
  args: { data: { strength: toPasswordStrength('Abacaxi123') } },
};

export const Good: Story = {
  args: { data: { strength: toPasswordStrength('abacaxi-2026') } },
};

export const Strong: Story = {
  args: { data: { strength: toPasswordStrength('Chuva-De-Verao-2026!') } },
};

/**
 * Caso limite: a coluna estreita do formulário no celular. A lista de quatro itens cai para
 * uma coluna só, e nenhum item pode quebrar no meio de uma palavra.
 */
export const InNarrowColumn: Story = {
  args: { data: { strength: toPasswordStrength('abacaxi-2026') } },
  render: (args) => (
    <div className="w-64 border border-dashed border-ink-300 p-2">
      <AzuosPasswordStrengthMeter {...args} />
    </div>
  ),
};
