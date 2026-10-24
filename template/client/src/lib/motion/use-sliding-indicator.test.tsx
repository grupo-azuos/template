import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSlidingIndicator } from './use-sliding-indicator';

function Menu({ active }: { active: string }) {
  const ref = useSlidingIndicator<HTMLElement>({
    selector: '[aria-current="page"]',
    indicatorClass: 'rounded-box bg-sidebar-accent',
    attributes: ['aria-current'],
  });

  return (
    <nav ref={ref}>
      {['a', 'b'].map((key) => (
        <a key={key} href={`#${key}`} aria-current={active === key ? 'page' : undefined}>
          {key}
        </a>
      ))}
    </nav>
  );
}

describe('useSlidingIndicator', () => {
  // feliz
  it('puts one decorative highlight behind the active item', () => {
    const { container } = render(<Menu active="a" />);
    const indicators = container.querySelectorAll('[data-slot="sliding-indicator"]');

    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toHaveAttribute('aria-hidden', 'true');
    expect(indicators[0]).toHaveClass('bg-sidebar-accent', 'absolute');
    expect(container.querySelector('nav')).toHaveClass('relative', 'isolate');
  });

  it('keeps a single highlight when the active item changes', () => {
    const { container, rerender } = render(<Menu active="a" />);

    rerender(<Menu active="b" />);

    expect(container.querySelectorAll('[data-slot="sliding-indicator"]')).toHaveLength(1);
  });

  // triste
  it('takes the highlight away when it unmounts', () => {
    const { container, unmount } = render(<Menu active="a" />);
    const nav = container.querySelector('nav');

    unmount();

    expect(nav?.querySelector('[data-slot="sliding-indicator"]')).toBeNull();
  });
});
