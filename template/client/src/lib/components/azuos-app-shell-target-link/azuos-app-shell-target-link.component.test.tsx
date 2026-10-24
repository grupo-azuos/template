import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AzuosAppShellTargetLink,
  type AzuosAppShellTargetLinkProps,
} from './azuos-app-shell-target-link.component';

function renderLink(props: AzuosAppShellTargetLinkProps) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <AzuosAppShellTargetLink {...props} /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(<RouterProvider router={router} />);
}

describe('AzuosAppShellTargetLink', () => {
  // feliz
  it('links to an internal route', async () => {
    renderLink({ data: { target: { to: '/profile' } }, children: 'Perfil' });

    expect(await screen.findByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/profile');
  });

  it('opens an outside address in a new tab safely', async () => {
    renderLink({
      data: { target: { href: 'https://example.com/support', opensInNewTab: true } },
      children: 'Suporte',
    });

    const link = await screen.findByRole('link', { name: 'Suporte' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // triste
  it('keeps an outside address in the same tab when not asked otherwise', async () => {
    renderLink({ data: { target: { href: 'https://example.com' } }, children: 'Conta' });

    const link = await screen.findByRole('link', { name: 'Conta' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });
});
