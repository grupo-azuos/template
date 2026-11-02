import { render, screen } from '@testing-library/react';
import { UserRound, Trash2 } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { AzuosSectionTitle } from './azuos-section-title.component';

describe('AzuosSectionTitle', () => {
  // feliz
  it('shows the title as a heading with its description', () => {
    render(
      <AzuosSectionTitle
        data={{ title: 'Dados pessoais', description: 'Como a equipe vê você.' }}
        ui={{ icon: UserRound }}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Dados pessoais' })).toBeInTheDocument();
    expect(screen.getByText('Como a equipe vê você.')).toBeInTheDocument();
  });

  it('puts the adornment inside the heading', () => {
    render(
      <AzuosSectionTitle
        data={{ title: 'Sistemas' }}
        ui={{ icon: UserRound }}
        adornment={<span>3</span>}
      />,
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Sistemas3');
  });

  // triste
  it('leaves out an empty description instead of an empty line', () => {
    const { container } = render(
      <AzuosSectionTitle data={{ title: 'Senha', description: '' }} ui={{ icon: UserRound }} />,
    );

    expect(container.querySelector('p')).toBeNull();
  });

  // triste
  /* O tom `danger` é só para a zona de perigo: o vermelho no título avisa antes do botão. */
  it('paints the danger zone red, in the icon and in the title', () => {
    render(
      <AzuosSectionTitle data={{ title: 'Excluir conta' }} ui={{ icon: Trash2, tone: 'danger' }} />,
    );

    const heading = screen.getByRole('heading', { name: 'Excluir conta' });
    expect(heading.className).toContain('text-destructive');
    expect(heading.parentElement?.previousElementSibling?.className).toContain(
      'bg-hue-red',
    );
  });
});
