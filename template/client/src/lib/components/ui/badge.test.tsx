import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  // feliz
  it.each(['default', 'secondary', 'destructive', 'outline'] as const)(
    'paints the %s variant',
    (variant) => {
      render(<Badge variant={variant}>novo</Badge>);

      expect(screen.getByText('novo')).toHaveAttribute('data-variant', variant);
      expect(badgeVariants({ variant })).toContain('inline-flex');
    },
  );

  it('lends its look to a link when asked', () => {
    render(
      <Badge asChild>
        <a href="#novidades">novidades</a>
      </Badge>,
    );

    expect(screen.getByRole('link', { name: 'novidades' })).toHaveAttribute('data-slot', 'badge');
  });

  // triste
  it('falls back to the default variant', () => {
    render(<Badge>x</Badge>);

    expect(screen.getByText('x')).toHaveAttribute('data-variant', 'default');
  });
});
