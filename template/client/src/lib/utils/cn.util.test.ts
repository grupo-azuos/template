import { describe, expect, it } from 'vitest';

import { cn } from './cn.util';

describe('cn', () => {
  // feliz
  it('lets the house radius beat the downloaded component radius', () => {
    expect(cn('rounded-md border', 'rounded-control')).toBe('border rounded-control');
  });

  // feliz
  it('treats the four radius roles as one family', () => {
    expect(cn('rounded-surface', 'rounded-box')).toBe('rounded-box');
    expect(cn('rounded-lg', 'rounded-chip')).toBe('rounded-chip');
  });

  // feliz
  it('lets the ruler height beat earlier height and side padding', () => {
    expect(cn('h-9 px-4 text-sm', 'control-lg')).toBe('text-sm control-lg');
  });

  // feliz
  it('replaces one ruler step with another', () => {
    expect(cn('control-lg', 'control-sm')).toBe('control-sm');
  });

  // feliz
  it('lets the icon step beat earlier height, width and size', () => {
    expect(cn('size-9', 'control-icon-md')).toBe('control-icon-md');
    expect(cn('h-8 w-8', 'control-icon-sm')).toBe('control-icon-sm');
  });

  // feliz
  it('keeps padding written after the ruler', () => {
    expect(cn('control-lg', 'px-0!')).toBe('control-lg px-0!');
  });

  // triste
  it('does not resolve a variant-imposed height: it must be beaten in the same variant', () => {
    /* É o caso do `ui/select`: a altura dele vem como `data-[size=default]:h-9`, e uma classe sem
       variante não a derruba. Quem envolve tem de escrever a altura na mesma variante. */
    expect(cn('data-[size=default]:h-9', 'control-lg')).toBe('data-[size=default]:h-9 control-lg');
    expect(cn('data-[size=default]:h-9', 'data-[size=default]:h-(--control-lg)')).toBe(
      'data-[size=default]:h-(--control-lg)',
    );
  });

  // triste
  it('ignores empty and falsy values', () => {
    expect(cn('rounded-control', undefined, null, false, '')).toBe('rounded-control');
  });
});
