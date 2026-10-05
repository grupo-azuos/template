import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosFilterField } from './azuos-filter-field.component';

describe('AzuosFilterField', () => {
  // feliz
  it('shows the label above the control', () => {
    render(
      <AzuosFilterField data={{ label: 'Situação' }}>
        <button type="button">A fazer</button>
      </AzuosFilterField>,
    );

    expect(screen.getByText('Situação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A fazer' })).toBeInTheDocument();
  });

  /* O rótulo é VISUAL: marcá-lo como `<label>` faria o leitor de tela anunciar o nome duas vezes,
     porque o controle de dentro já traz o seu `aria-label`. */
  it('does not label the control twice', () => {
    const { container } = render(
      <AzuosFilterField data={{ label: 'Situação' }}>
        <button type="button" aria-label="Situação">
          A fazer
        </button>
      </AzuosFilterField>,
    );

    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  it('accepts an extra class without losing the column', () => {
    const { container } = render(
      <AzuosFilterField data={{ label: 'Situação' }} ui={{ className: 'w-44' }}>
        <span>controle</span>
      </AzuosFilterField>,
    );

    expect(container.firstElementChild?.className).toContain('w-44');
    expect(container.firstElementChild?.className).toContain('flex-col');
  });

  // triste
  /* Filtro sem controle acontece enquanto as opções carregam. O rótulo sozinho é melhor que a
     fileira saltando de lugar quando o controle finalmente aparece. */
  it('still shows the label when there is no control yet', () => {
    render(<AzuosFilterField data={{ label: 'Responsável' }} />);

    expect(screen.getByText('Responsável')).toBeInTheDocument();
  });
});
