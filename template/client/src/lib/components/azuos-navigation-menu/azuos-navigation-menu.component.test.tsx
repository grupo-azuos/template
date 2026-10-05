import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosNavigationMenu } from './azuos-navigation-menu.component';

const ITEMS = [
  { label: 'Visão geral', href: '/tasks/12', isActive: true },
  { label: 'Histórico', href: '/tasks/12/history' },
];

describe('AzuosNavigationMenu', () => {
  // feliz
  /* Links de VERDADE, e não botões: a pessoa pode abrir numa aba nova, e o endereço diz onde ela
     está. Com botão, as duas coisas se perdem. */
  it('draws real links and names the menu for a screen reader', () => {
    render(<AzuosNavigationMenu data={{ items: ITEMS }} ui={{ ariaLabel: 'Seções da tarefa' }} />);

    expect(screen.getByRole('navigation', { name: 'Seções da tarefa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Histórico' })).toHaveAttribute(
      'href',
      '/tasks/12/history',
    );
  });

  it('marks the current section with aria-current, not only with colour', () => {
    render(<AzuosNavigationMenu data={{ items: ITEMS }} ui={{ ariaLabel: 'Seções da tarefa' }} />);

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Histórico' })).not.toHaveAttribute('aria-current');
  });

  // triste
  /* Menu sem itens não é um menu: uma barra vazia empurraria o conteúdo e a tela nasceria
     desalinhada das outras. */
  it('draws nothing when there is no section', () => {
    const { container } = render(
      <AzuosNavigationMenu data={{ items: [] }} ui={{ ariaLabel: 'Seções da tarefa' }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lights nothing up when no section is marked', () => {
    render(
      <AzuosNavigationMenu
        data={{ items: ITEMS.map((item) => ({ ...item, isActive: false })) }}
        ui={{ ariaLabel: 'Seções da tarefa' }}
      />,
    );

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });
});
