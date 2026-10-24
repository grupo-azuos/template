import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lock } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosMyProfileView, type AzuosMyProfileViewProps } from './azuos-my-profile-view.component';

const person = {
  name: 'Ana Souza',
  email: 'ana@grupoazuos.com.br',
  roleLabel: 'Administrador',
  avatarUrl: null,
  jobTitle: 'Analista fiscal',
  department: null,
  phone: '11912345678',
  birthDateLabel: '25/03/1990',
  bio: null,
  systems: [{ name: 'Paralegal', url: 'https://paralegal.test', roleLabel: 'Usuário' }],
};

function renderView(overrides: Partial<AzuosMyProfileViewProps> = {}) {
  const props: AzuosMyProfileViewProps = {
    data: { person, accountUrl: 'https://admin-console.test/profile', theme: 'light' },
    actions: { onToggleTheme: vi.fn(), onRetry: vi.fn() },
    ...overrides,
  };
  render(<AzuosMyProfileView {...props} />);

  return props;
}

describe('AzuosMyProfileView', () => {
  // feliz
  it('shows who the person is, read-only', () => {
    renderView();

    expect(screen.getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getAllByText('ana@grupoazuos.com.br').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Administrador').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Analista fiscal').length).toBeGreaterThan(0);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('sends the person to the admin console to edit', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'Editar no Admin Console' })).toHaveAttribute(
      'href',
      'https://admin-console.test/profile',
    );
  });

  it('switches the theme', async () => {
    const props = renderView();

    const toggle = screen.getByRole('switch', { name: 'Tema escuro' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(props.actions.onToggleTheme).toHaveBeenCalledOnce();
  });

  it('lists the systems the person opens, each with the role there', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'Paralegal' })).toHaveAttribute('href', 'https://paralegal.test');
    expect(screen.getByText('Usuário')).toBeInTheDocument();
  });

  it('shows phone and birth date read-only', () => {
    renderView();

    expect(screen.getAllByText('11912345678').length).toBeGreaterThan(0);
    expect(screen.getByText('25/03/1990')).toBeInTheDocument();
  });

  /* Só o admin-console encaixa formulários: a ficha é a mesma, o bloco de leitura sai. */
  it('swaps a read-only block for the form the admin console mounts', () => {
    renderView({
      slots: {
        bannerAside: <button type="button">Trocar foto</button>,
        personal: <form aria-label="Editar dados pessoais" />,
        extraSections: [{ id: 'profile-password', label: 'Senha', icon: Lock, content: <p>Senha aqui</p> }],
      },
    });

    expect(screen.getByRole('form', { name: 'Editar dados pessoais' })).toBeInTheDocument();
    expect(screen.queryByText('Data de nascimento')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar no Admin Console' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Senha' })).toHaveAttribute('href', '#profile-password');
    expect(screen.getByText('Senha aqui')).toBeInTheDocument();
  });

  // triste
  it('says when the systems could not be read', () => {
    renderView({ data: { person: { ...person, systems: undefined }, accountUrl: null, theme: 'light' } });

    expect(screen.getByText('Não consegui ver seus sistemas agora.')).toBeInTheDocument();
  });

  it('says when a field was never filled in', () => {
    renderView();

    expect(screen.getAllByText('Não informado').length).toBeGreaterThan(0);
  });

  it('hides the edit button without an account address', () => {
    renderView({ data: { person, accountUrl: null, theme: 'dark' } });

    expect(screen.queryByRole('link', { name: 'Editar no Admin Console' })).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Tema escuro' })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows the skeleton while loading', () => {
    renderView({ state: { isLoading: true } });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando seu perfil');
  });

  it('offers a retry when the profile did not load', async () => {
    const props = renderView({
      data: { person: null, accountUrl: null, theme: 'light' },
      state: { error: 'Não consegui carregar seu perfil.' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Não consegui carregar seu perfil.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(props.actions.onRetry).toHaveBeenCalledOnce();
  });
});
