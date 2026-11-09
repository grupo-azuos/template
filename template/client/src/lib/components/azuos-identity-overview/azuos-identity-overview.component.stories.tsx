import { type Meta, type StoryObj } from '@storybook/react';
import { AzuosIdentityOverview } from './azuos-identity-overview.component';
const meta = {
  title: 'Components/AzuosIdentityOverview',
  component: AzuosIdentityOverview,
  args: {
    data: {
      person: { name: 'Ana Souza', email: 'ana@example.test', roleLabel: 'Consulta' },
      accountUrl: 'https://account.example.test/profile',
    },
  },
} satisfies Meta<typeof AzuosIdentityOverview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = { args: { data: { person: null }, state: { isLoading: true } } };
export const Error: Story = {
  args: { data: { person: null }, state: { error: 'Não consegui carregar o perfil.' } },
};
export const LongName: Story = {
  args: {
    data: {
      person: {
        name: 'Ana Maria de Souza e Albuquerque',
        email: 'ana.souza@example.test',
        roleLabel: 'Administrador',
      },
    },
  },
};
