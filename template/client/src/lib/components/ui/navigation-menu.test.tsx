import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu';

function renderMenu(viewport: boolean) {
  return render(
    <NavigationMenu value="cadastros" viewport={viewport}>
      <NavigationMenuList>
        <NavigationMenuItem value="cadastros">
          <NavigationMenuTrigger>Cadastros</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#clientes">Clientes</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#inicio" active className={navigationMenuTriggerStyle()}>
            Início
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuIndicator />
      </NavigationMenuList>
    </NavigationMenu>,
  );
}

describe('NavigationMenu', () => {
  // feliz
  it('shows the open item inside the viewport', () => {
    renderMenu(true);

    expect(screen.getByRole('button', { name: 'Cadastros' })).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="navigation-menu-viewport"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'true',
    );
  });

  it('marks the current page link as active', () => {
    renderMenu(true);

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('data-active');
  });

  // triste
  it('drops into the item itself without a viewport', () => {
    renderMenu(false);

    expect(
      document.querySelector('[data-slot="navigation-menu-viewport"]'),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'false',
    );
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
  });
});
