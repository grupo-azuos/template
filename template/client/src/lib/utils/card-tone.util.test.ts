import { describe, expect, it } from 'vitest';

import { CARD_HUES, cardHueFromHex, cardHueOf, cardToneClasses } from './card-tone.util';

describe('cardToneClasses', () => {
  // feliz
  it('maps every state name to its hue and keeps a hue as it is', () => {
    expect(cardHueOf('danger')).toBe('red');
    expect(cardHueOf('warning')).toBe('amber');
    expect(cardHueOf('info')).toBe('sky');
    expect(cardHueOf('success')).toBe('emerald');
    expect(cardHueOf('brand')).toBe('indigo');
    expect(cardHueOf('violet')).toBe('violet');
    expect(cardToneClasses('pink').surface).toBe('bg-tone-pink-surface text-tone-pink-text');
  });

  it('gives every hue the four states, all from tokens', () => {
    expect(CARD_HUES).toHaveLength(17);
    for (const hue of CARD_HUES) {
      const classes = cardToneClasses(hue);
      expect(classes.hover).toBe(`hover:bg-tone-${hue}-hover`);
      expect(classes.chipSelected).toBe(`bg-tone-${hue}-text text-tone-${hue}-surface`);
    }
  });

  it('turns a free colour into the nearest hue', () => {
    expect(cardHueFromHex('#dc2626')).toBe('red');
    expect(cardHueFromHex('#ea580c')).toBe('orange');
    expect(cardHueFromHex('#16a34a')).toBe('green');
    expect(cardHueFromHex('#2563eb')).toBe('indigo');
    expect(cardHueFromHex('#7c3aed')).toBe('violet');
    expect(cardHueFromHex('#0891b2')).toBe('cyan');
    expect(cardHueFromHex('#db2777')).toBe('pink');
    expect(cardHueFromHex('#6b7280')).toBe('slate');
  });

  // triste
  it('falls back to gray for nothing, an unknown name or a broken colour', () => {
    expect(cardHueOf(undefined)).toBe('gray');
    expect(cardHueOf('purple' as never)).toBe('gray');
    expect(cardHueFromHex('vermelho')).toBe('gray');
    expect(cardHueFromHex(null)).toBe('gray');
  });
});
