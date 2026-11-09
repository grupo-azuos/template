import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AzuosIdentityOverview } from './azuos-identity-overview.component';

const person = { name: 'Ana Souza', email: 'ana@example.test', roleLabel: 'Consulta' };
describe('AzuosIdentityOverview', () => {
  // feliz
  it('shows identity, account details and theme preferences', () => {
    render(
      <AzuosIdentityOverview
        data={{ person, accountUrl: 'https://account.example.test/profile' }}
      />,
    );
    expect(screen.getByRole('heading', { name: person.name, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gerenciar minha conta' })).toHaveAttribute(
      'href',
      'https://account.example.test/profile',
    );
    expect(screen.getByRole('button', { name: /Mudar para o tema/ })).toBeVisible();
  });
  // triste
  it('shows the error without inventing an identity or account destination', () => {
    render(<AzuosIdentityOverview data={{ person: null }} state={{ error: 'Sem identidade.' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Sem identidade.');
    expect(screen.queryByText(person.name)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('keeps unknown optional profile fields absent', () => {
    render(<AzuosIdentityOverview data={{ person }} />);
    expect(screen.queryByText('Cargo')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
