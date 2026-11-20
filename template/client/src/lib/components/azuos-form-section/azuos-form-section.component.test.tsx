import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosFormSection } from './azuos-form-section.component';

describe('AzuosFormSection', () => {
  it('names the section after its title and shows the content', () => {
    render(
      <AzuosFormSection data={{ title: 'Conversas', description: 'Salvo na hora.' }}>
        <p>conteúdo</p>
      </AzuosFormSection>,
    );

    expect(screen.getByRole('region', { name: 'Conversas' })).toBeInTheDocument();
    expect(screen.getByText('Salvo na hora.')).toBeInTheDocument();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('replaces the content with the written reason when locked', () => {
    render(
      <AzuosFormSection
        data={{ title: 'Conversas' }}
        state={{ lockedMessage: 'Salve o alvará primeiro.' }}
      >
        <p>conteúdo</p>
      </AzuosFormSection>,
    );

    expect(screen.getByText('Salve o alvará primeiro.')).toBeInTheDocument();
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument();
  });
});
