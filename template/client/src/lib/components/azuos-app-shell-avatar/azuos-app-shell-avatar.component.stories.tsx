import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosAppShellAvatar } from './azuos-app-shell-avatar.component';

const meta = {
  title: 'Navegação e estrutura/AzuosAppShellAvatar',
  component: AzuosAppShellAvatar,
  args: { data: { name: 'Ana Souza' } },
} satisfies Meta<typeof AzuosAppShellAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Photo: Story = {
  args: { data: { name: 'Ana Souza', avatarUrl: 'https://i.pravatar.cc/64?img=5' } },
};
