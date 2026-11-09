import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

/*
 * O valor atrasado que a busca usa para não bater na API a cada tecla. O que está em prova é
 * o atraso e o descarte do valor intermediário.
 */
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  // feliz: começa com o valor dado e só muda depois do atraso.
  it('starts with the value and updates after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });

  // triste: digitar de novo antes do prazo descarta o valor do meio.
  it('drops an intermediate value typed before the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    });

    rerender({ value: 'p' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'pã' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('pã');
  });
});
