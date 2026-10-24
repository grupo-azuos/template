import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosMyProfileView } from './azuos-my-profile-view.component';

const person = {
  name: 'Ana Souza',
  email: 'ana.souza@grupoazuos.com.br',
  roleLabel: 'Administrador',
  avatarUrl: null,
  jobTitle: 'Analista fiscal',
  department: 'Fiscal',
  phone: '(11) 91234-5678',
  birthDateLabel: '25/03/1990',
  bio: 'Cuido do fechamento fiscal das empresas do grupo.',
  systems: [
    { name: 'Paralegal', url: 'https://paralegal.grupoazuos.com.br', roleLabel: 'Gestor' },
    { name: 'Gestão Contábil', url: 'https://contabil.grupoazuos.com.br', roleLabel: 'Usuário' },
  ],
};

const meta = {
  title: 'Navegação e estrutura/AzuosMyProfileView',
  component: AzuosMyProfileView,
  args: {
    data: { person, accountUrl: 'https://admin-console.grupoazuos.com.br/profile', theme: 'light' },
    actions: { onToggleTheme: fn(), onRetry: fn() },
  },
} satisfies Meta<typeof AzuosMyProfileView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhoto: Story = {
  args: {
    data: {
      person: { ...person, avatarUrl: 'https://i.pravatar.cc/192?img=5' },
      accountUrl: 'https://admin-console.grupoazuos.com.br/profile',
      theme: 'light',
    },
  },
};

export const MissingFields: Story = {
  args: {
    data: {
      person: { ...person, jobTitle: null, department: null, phone: null, birthDateLabel: null, bio: null, systems: undefined },
      accountUrl: 'https://admin-console.grupoazuos.com.br/profile',
      theme: 'dark',
    },
  },
};

export const Loading: Story = { args: { state: { isLoading: true } } };

export const LoadError: Story = {
  args: {
    data: { person: null, accountUrl: null, theme: 'light' },
    state: { error: 'Não consegui carregar seu perfil.' },
  },
};
