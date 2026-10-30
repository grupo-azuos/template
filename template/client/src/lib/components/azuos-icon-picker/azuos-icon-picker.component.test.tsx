import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkCheck, Clock } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosIconPicker } from './azuos-icon-picker.component';

const OPTIONS = [
  { value: 'bookmark-check', label: 'Marcador', icon: BookmarkCheck },
  { value: 'clock', label: 'Relógio', icon: Clock },
];

function renderPicker(isDisabled = false) {
  const onChange = vi.fn();
  render(
    <AzuosIconPicker
      data={{ value: 'bookmark-check', options: OPTIONS }}
      ui={{ label: 'Ícone' }}
      state={{ isDisabled }}
      actions={{ onChange }}
    />,
  );

  return onChange;
}

describe('AzuosIconPicker', () => {
  // feliz
  it('marks the chosen icon and picks another by its Portuguese name', async () => {
    const onChange = renderPicker();

    expect(screen.getByRole('button', { name: 'Marcador' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Relógio' }));

    expect(onChange).toHaveBeenCalledWith('clock');
  });

  // triste
  it('does not let anything be picked while disabled', () => {
    renderPicker(true);

    expect(screen.getByRole('button', { name: 'Relógio' })).toBeDisabled();
  });
});
