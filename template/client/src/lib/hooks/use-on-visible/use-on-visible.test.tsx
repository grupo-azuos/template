import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useOnVisible } from './use-on-visible';

function Sentinel({ onVisible, isEnabled }: { onVisible: () => void; isEnabled: boolean }) {
  const { ref } = useOnVisible(onVisible, { isEnabled });

  return <div ref={ref}>fim da lista</div>;
}

describe('useOnVisible', () => {
  afterEach(() => vi.unstubAllGlobals());

  // feliz
  it('calls back when the sentinel comes into view', () => {
    let trigger: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof trigger) {
          trigger = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const onVisible = vi.fn();

    const { unmount } = render(<Sentinel onVisible={onVisible} isEnabled />);
    trigger([{ isIntersecting: false }]);
    trigger([{ isIntersecting: true }]);
    unmount();

    expect(onVisible).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalled();
  });

  // triste
  it('does not observe while disabled or without IntersectionObserver', () => {
    const onVisible = vi.fn();
    vi.stubGlobal('IntersectionObserver', undefined);

    render(<Sentinel onVisible={onVisible} isEnabled />);
    render(<Sentinel onVisible={onVisible} isEnabled={false} />);

    expect(onVisible).not.toHaveBeenCalled();
  });
});
