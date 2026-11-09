import { describe, expect, it } from 'vitest';

import { sidebarOpenFromCookie } from './sidebar-state.util';

describe('sidebarOpenFromCookie', () => {
  // feliz
  it('reads the choice the sidebar stored', () => {
    expect(sidebarOpenFromCookie('theme=x; sidebar_state=false')).toBe(false);
    expect(sidebarOpenFromCookie('sidebar_state=true')).toBe(true);
  });

  // triste
  it('opens the sidebar without a cookie or with an odd value', () => {
    expect(sidebarOpenFromCookie('')).toBe(true);
    expect(sidebarOpenFromCookie('sidebar_state=talvez')).toBe(true);
    expect(sidebarOpenFromCookie('other_sidebar_state=false')).toBe(true);
  });
});
