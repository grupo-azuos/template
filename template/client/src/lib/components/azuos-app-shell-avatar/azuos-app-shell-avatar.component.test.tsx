import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosAppShellAvatar, initialsOf } from './azuos-app-shell-avatar.component';

describe('AzuosAppShellAvatar', () => {
  // feliz
  it('shows two initials', () => {
    render(<AzuosAppShellAvatar data={{ name: 'Ana Maria Souza' }} />);

    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('puts the photo over the initials', () => {
    const { container } = render(
      <AzuosAppShellAvatar data={{ name: 'Ana Souza', avatarUrl: 'https://example.com/a.png' }} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
  });

  // triste
  it('falls back to a question mark without a name', () => {
    expect(initialsOf('   ')).toBe('?');
  });

  it('draws no image without a photo', () => {
    const { container } = render(<AzuosAppShellAvatar data={{ name: 'Ana', avatarUrl: null }} />);

    expect(container.querySelector('img')).toBeNull();
  });
});
