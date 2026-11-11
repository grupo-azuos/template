import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

  it('discounts the container border so the highlight sits exactly behind the item', () => {
    const rect = (left: number, top: number) => ({ left, top, width: 32, height: 32 }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.tagName === 'NAV' ? rect(100, 50) : rect(103, 53);
    });
    vi.spyOn(HTMLElement.prototype, 'clientLeft', 'get').mockReturnValue(1);
    vi.spyOn(HTMLElement.prototype, 'clientTop', 'get').mockReturnValue(1);

    const { container } = render(<Menu active="a" />);
    const indicator = container.querySelector<HTMLElement>('[data-slot="sliding-indicator"]');

    expect(indicator?.style.transform).toContain('translate(2px, 2px)');
    vi.restoreAllMocks();
  });

  it('keeps a single highlight when the active item changes', () => {
    const { container, rerender } = render(<Menu active="a" />);

    rerender(<Menu active="b" />);

    expect(container.querySelectorAll('[data-slot="sliding-indicator"]')).toHaveLength(1);
  });

  // triste
  /* REGRESSÃO: sem ativo na lista (a tela aberta é de outra parte do menu), o destaque ficava
     invisível mas do tamanho e na altura do ativo antigo, e esticava o menu com uma rolagem. */
  it('shrinks the highlight to nothing at the top when the list has no active item', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return (
        this.tagName === 'NAV'
          ? { left: 0, top: 0, width: 200, height: 80 }
          : { left: 0, top: 600, width: 200, height: 40 }
      ) as DOMRect;
    });
    const { container, rerender } = render(<Menu active="b" />);
    const indicator = container.querySelector<HTMLElement>('[data-slot="sliding-indicator"]');
    expect(indicator?.style.height).toBe('40px');

    rerender(<Menu active="nenhum" />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(indicator?.style.height).toBe('0px');
    expect(indicator?.style.width).toBe('0px');
    expect(indicator?.style.opacity).toBe('0');
    vi.restoreAllMocks();
  });

  // triste
  it('takes the highlight away when it unmounts', () => {
    const { container, unmount } = render(<Menu active="a" />);
    const nav = container.querySelector('nav');

    unmount();

    expect(nav?.querySelector('[data-slot="sliding-indicator"]')).toBeNull();
  });
});
