import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AzuosCarousel } from './azuos-carousel.component';

/* O Embla pede `IntersectionObserver`, que o jsdom não tem. O stub mora aqui, e não só no setup,
   para o teste valer em qualquer sistema que receba o componente do template. */
beforeAll(() => {
  if (window.IntersectionObserver) return;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterAll(() => vi.unstubAllGlobals());

describe('AzuosCarousel', () => {
  // feliz
  it('puts each child in its own slide, inside a named region', () => {
    render(
      <AzuosCarousel ui={{ ariaLabel: 'Resumo por status', itemClassName: 'basis-1/2' }}>
        <span>Iniciado</span>
        <span>Concluído</span>
      </AzuosCarousel>,
    );

    expect(screen.getByRole('region', { name: 'Resumo por status' })).toBeInTheDocument();
    const slides = screen.getAllByRole('group');
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveTextContent('Iniciado');
    expect(slides[0]).toHaveClass('basis-1/2');
  });

  // triste
  it('keeps the arrows disabled, with Portuguese names, when there is nothing to slide', () => {
    render(<AzuosCarousel ui={{ ariaLabel: 'Vazio' }} />);

    expect(screen.queryAllByRole('group')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Ver anteriores' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ver próximos' })).toBeDisabled();
  });
});
