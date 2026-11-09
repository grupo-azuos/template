import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

function renderCarousel(
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  setApi?: (api: CarouselApi) => void,
) {
  return render(
    <Carousel orientation={orientation} setApi={setApi} aria-label="Destaques">
      <CarouselContent>
        <CarouselItem>Primeiro</CarouselItem>
        <CarouselItem>Segundo</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>,
  );
}

describe('Carousel', () => {
  // feliz
  it('announces itself as a carousel with its slides', () => {
    renderCarousel();

    expect(screen.getByRole('region', { name: 'Destaques' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getByText('Primeiro').className).toContain('pl-4');
  });

  it('hands the engine to whoever asked for it', () => {
    const setApi = vi.fn();
    renderCarousel('horizontal', setApi);

    expect(setApi).toHaveBeenCalled();
  });

  it('lays the slides vertically when asked', () => {
    renderCarousel('vertical');

    expect(screen.getByText('Primeiro').className).toContain('pt-4');
    expect(screen.getByText('Primeiro').parentElement?.className).toContain('flex-col');
  });

  it('moves with the arrow keys and the buttons without failing', () => {
    renderCarousel();
    const region = screen.getByRole('region', { name: 'Destaques' });

    fireEvent.keyDown(region, { key: 'ArrowRight' });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    fireEvent.keyDown(region, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));

    expect(region).toBeInTheDocument();
  });

  // triste
  /* No jsdom nada tem largura: o motor não consegue rolar, e os dois botões ficam desligados. */
  it('disables both buttons when there is nowhere to scroll', () => {
    renderCarousel();

    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('refuses a slide outside a carousel', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<CarouselItem>solto</CarouselItem>)).toThrow(/within a <Carousel/);

    spy.mockRestore();
  });
});
