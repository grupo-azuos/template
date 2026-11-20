import gsap from 'gsap';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rotateTo } from './rotate.util';

describe('rotateTo', () => {
  afterEach(() => vi.restoreAllMocks());

  // feliz
  it('turns the icon to the angle asked', () => {
    const to = vi.spyOn(gsap, 'to').mockReturnValue({} as gsap.core.Tween);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);

    rotateTo('#seta', 90);

    expect(to).toHaveBeenCalledWith('#seta', expect.objectContaining({ rotate: 90 }));
  });

  // triste
  it('jumps straight to the angle for who asked for less motion', () => {
    const set = vi.spyOn(gsap, 'set').mockReturnValue({} as gsap.core.Tween);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    rotateTo('#seta', 0);

    expect(set).toHaveBeenCalledWith('#seta', { rotate: 0 });
  });
});
