import { renderHook } from '@testing-library/react';
import gsap from 'gsap';
import { type PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCardWash } from './use-card-wash';

afterEach(() => vi.restoreAllMocks());

/** Um evento de ponteiro sobre um card de 100x50 na origem. */
function pointerAt(x: number, y: number) {
  const target = document.createElement('div');
  target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;

  return {
    clientX: x,
    clientY: y,
    currentTarget: target,
  } as unknown as ReactPointerEvent<HTMLElement>;
}

function mountWash() {
  const hook = renderHook(() => useCardWash());
  hook.result.current.washRef.current = document.createElement('span');

  return hook;
}

describe('useCardWash', () => {
  // feliz
  it('grows the wash from the pointer and shrinks it towards where it left', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo');
    const to = vi.spyOn(gsap, 'to');
    const { result } = mountWash();

    result.current.handlers.onPointerEnter(pointerAt(10, 10));
    result.current.handlers.onPointerLeave(pointerAt(90, 40));

    expect(fromTo).toHaveBeenCalledOnce();
    expect(to).toHaveBeenCalledWith(
      expect.any(HTMLSpanElement),
      expect.objectContaining({ left: 90, top: 40, scale: 0 }),
    );
  });

  // triste
  it('shows and hides the wash without growing when motion is reduced', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const fromTo = vi.spyOn(gsap, 'fromTo');
    const set = vi.spyOn(gsap, 'set');
    const { result } = mountWash();

    result.current.handlers.onPointerEnter(pointerAt(10, 10));
    result.current.handlers.onPointerLeave(pointerAt(10, 10));

    expect(fromTo).not.toHaveBeenCalled();
    expect(set).toHaveBeenLastCalledWith(
      expect.any(HTMLSpanElement),
      expect.objectContaining({ scale: 0 }),
    );
  });

  it('does nothing before the wash is on the page', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo');
    const { result } = renderHook(() => useCardWash());

    result.current.handlers.onPointerEnter(pointerAt(10, 10));
    result.current.handlers.onPointerLeave(pointerAt(10, 10));

    expect(fromTo).not.toHaveBeenCalled();
  });
});
