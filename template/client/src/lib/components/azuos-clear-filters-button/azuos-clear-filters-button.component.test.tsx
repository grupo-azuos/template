import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosClearFiltersButton } from './azuos-clear-filters-button.component';

describe('AzuosClearFiltersButton', () => {
  // feliz
  it('clears the filters when clicked', async () => {
    const onClear = vi.fn();
    render(<AzuosClearFiltersButton state={{ hasFilter: true }} actions={{ onClear }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  // triste
  it('does not show up when there is no filter to clear', () => {
    render(<AzuosClearFiltersButton state={{ hasFilter: false }} actions={{ onClear: vi.fn() }} />);

    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });
});
