import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDragScrollFollow } from './use-drag-scroll-follow';

/** Os `mousemove` que chegam ao documento — o que a biblioteca de arrastar escuta. */
function spyMoves() {
  const moves: { x: number; y: number }[] = [];
  const listener = (event: MouseEvent) => moves.push({ x: event.clientX, y: event.clientY });
  document.addEventListener('mousemove', listener);

  return {
    moves,
    stop: () => document.removeEventListener('mousemove', listener),
  };
}

const scroll = () => document.body.dispatchEvent(new Event('scroll'));
const mouseAt = (x: number, y: number) =>
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));

afterEach(() => vi.restoreAllMocks());

describe('useDragScrollFollow', () => {
  // feliz
  it('repeats the last mouse point on scroll while dragging', () => {
    const { result } = renderHook(useDragScrollFollow);
    act(() => result.current.onStart(new MouseEvent('mousedown', { clientX: 10, clientY: 20 })));
    mouseAt(30, 40);
    const spy = spyMoves();

    scroll();

    expect(spy.moves).toEqual([{ x: 30, y: 40 }]);
    spy.stop();
  });

  // feliz
  it('uses the drag start point when the mouse has not moved yet', () => {
    const { result } = renderHook(useDragScrollFollow);
    act(() => result.current.onStart(new MouseEvent('mousedown', { clientX: 10, clientY: 20 })));
    const spy = spyMoves();

    scroll();

    expect(spy.moves).toEqual([{ x: 10, y: 20 }]);
    spy.stop();
  });

  // triste
  it('does nothing on scroll when no drag is happening', () => {
    renderHook(useDragScrollFollow);
    mouseAt(30, 40);
    const spy = spyMoves();

    scroll();

    expect(spy.moves).toEqual([]);
    spy.stop();
  });

  // triste
  it('stops repeating after the drag ends', () => {
    const { result } = renderHook(useDragScrollFollow);
    act(() => result.current.onStart(new MouseEvent('mousedown', { clientX: 10, clientY: 20 })));
    act(() => result.current.onStop());
    const spy = spyMoves();

    scroll();

    expect(spy.moves).toEqual([]);
    spy.stop();
  });

  // triste
  it('waits for a real mouse point when the start event is not a mouse event', () => {
    const { result } = renderHook(useDragScrollFollow);
    act(() => result.current.onStart());
    const spy = spyMoves();

    scroll();
    expect(spy.moves).toEqual([]);

    mouseAt(5, 6);
    scroll();
    expect(spy.moves).toEqual([
      { x: 5, y: 6 },
      { x: 5, y: 6 },
    ]);
    spy.stop();
  });

  // triste
  it('removes its listeners on unmount', () => {
    const removed = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(useDragScrollFollow);

    unmount();

    expect(removed).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(removed).toHaveBeenCalledWith('mousemove', expect.any(Function), true);
  });
});
