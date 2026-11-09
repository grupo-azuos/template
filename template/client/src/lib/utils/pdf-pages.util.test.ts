import { describe, expect, it } from 'vitest';

import { MAX_PAGE_PIXEL_WIDTH, pageRenderRatio } from './pdf-pages.util';

describe('pageRenderRatio', () => {
  // feliz
  it('renders the page at 2×, sharp, for a narrow column on a dense screen', () => {
    expect(pageRenderRatio(600, 2)).toBe(2);
  });

  // feliz
  it('lowers the density for a wide column until the page fits the width ceiling', () => {
    const ratio = pageRenderRatio(900, 2);

    expect(900 * ratio).toBeCloseTo(MAX_PAGE_PIXEL_WIDTH);
  });

  // triste
  it('uses 1× without a given density, and does not divide by a zero width', () => {
    expect(pageRenderRatio(600, 0)).toBe(1);
    expect(pageRenderRatio(0, 3)).toBe(2);
  });
});
