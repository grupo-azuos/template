import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosPersonAvatar } from './azuos-person-avatar.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosPersonAvatar',
  component: AzuosPersonAvatar,
} satisfies Meta<typeof AzuosPersonAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** O caso de hoje: sem provedor de identidade externo, o avatar é sempre iniciais. */
export const Initials: Story = {
  args: { name: 'Rafael Camargo' },
};

/**
 * O caso de amanhã: `avatarUrl` preenchido troca as iniciais pela foto, sem quem usa
 * `AzuosPersonAvatar` mudar uma linha.
 */
export const WithPhoto: Story = {
  args: { name: 'Camila Duarte', avatarUrl: 'https://i.pravatar.cc/64?img=47' },
};

export const Small: Story = {
  args: { name: 'Ana', ui: { size: 'sm' } },
};

export const Medium: Story = {
  args: { name: 'Ana', ui: { size: 'md' } },
};

/** Caso limite: nome de uma palavra só cai numa iniciais só, não duas — não há sobrenome para tirar a segunda letra. */
export const SingleWordName: Story = {
  args: { name: 'Bia' },
};
