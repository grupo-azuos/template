import { BarChart3, ListChecks, Settings, Users, Wrench } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  activeNavItemOf,
  areaOfPath,
  isTwoColumn,
  navItemsOf,
  visibleActionsOf,
  visibleAreasOf,
} from './app-shell-navigation';

const items = [
  { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks, area: 'ops' },
  { key: 'archive', label: 'Arquivo', to: '/tasks/archive', icon: BarChart3, area: 'ops' },
  { key: 'team', label: 'Equipe', to: '/team', icon: Users, area: 'admin', isAdminOnly: true },
];
const areas = [
  { key: 'ops', label: 'Operação', icon: Wrench },
  { key: 'admin', label: 'Gestão', icon: Settings },
];
const viewer = { isAdmin: false };
const admin = { isAdmin: true };

describe('app-shell-navigation', () => {
  // feliz
  it('lights the longest matching route', () => {
    expect(activeNavItemOf('/tasks/archive/3', items)?.key).toBe('archive');
    expect(activeNavItemOf('/tasks/42', items)?.key).toBe('tasks');
  });

  it('lists the items of one area', () => {
    expect(navItemsOf(items, 'ops', viewer).map((item) => item.key)).toEqual(['tasks', 'archive']);
  });

  it('shows every area to an admin and picks two columns', () => {
    const visible = visibleAreasOf(areas, items, admin);

    expect(visible.map((area) => area.key)).toEqual(['ops', 'admin']);
    expect(isTwoColumn(visible)).toBe(true);
  });

  it('finds the area of the open route', () => {
    expect(areaOfPath('/team', items, areas)).toBe('admin');
  });

  // triste
  it('hides admin-only items and the areas left empty', () => {
    const visible = visibleAreasOf(areas, items, viewer);

    expect(navItemsOf(items, 'admin', viewer)).toEqual([]);
    expect(visible.map((area) => area.key)).toEqual(['ops']);
    expect(isTwoColumn(visible)).toBe(false);
  });

  it('falls back to the first area on an unknown route', () => {
    expect(areaOfPath('/nowhere', items, areas)).toBe('ops');
    expect(activeNavItemOf('/nowhere', items)).toBeUndefined();
  });

  it('hides admin-only shortcuts', () => {
    const actions = [{ key: 'tv', label: 'TV', icon: Wrench, to: '/tv', isAdminOnly: true }];

    expect(visibleActionsOf(actions, viewer)).toEqual([]);
    expect(visibleActionsOf(actions, admin)).toHaveLength(1);
  });
});
