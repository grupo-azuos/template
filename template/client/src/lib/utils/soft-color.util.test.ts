import { describe, expect, it } from 'vitest';

import { SOFT_COLOR_PERCENT, softColorOf } from './soft-color.util';

describe('softColorOf', () => {
  // feliz
  it('mixes the chosen color with the card background', () => {
    expect(softColorOf('#1b3a8c')).toBe(
      `color-mix(in srgb, #1b3a8c ${SOFT_COLOR_PERCENT}%, var(--card))`,
    );
  });

  // triste
  it('keeps any CSS color the person picked, even a named one', () => {
    expect(softColorOf('teal', 30)).toBe('color-mix(in srgb, teal 30%, var(--card))');
  });
});
