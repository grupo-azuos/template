import { createFileRoute } from '@tanstack/react-router';

import { AzuosBoardView } from './components/azuos-board-view/azuos-board-view.component';
import { AzuosFilterBuilderScreen } from './components/azuos-filter-builder-screen/azuos-filter-builder-screen.component';
import { useDashboardBoardModel } from '../../lib/view-models/use-dashboard-board.model';
import { useSavedFiltersModel } from '../../lib/view-models/use-saved-filters.model';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardRoute,
});

/** A rota só compõe: o painel e o montador de filtros, cada um com o seu view-model. */
function DashboardRoute() {
  const board = useDashboardBoardModel();
  const filters = useSavedFiltersModel();

  return (
    <>
      <AzuosBoardView
        data={{ ...board.data, filters: filters.data.filters }}
        state={{ ...board.state, isFilterScreenOpen: filters.state.isOpen }}
        actions={{ ...board.actions, onOpenFilters: () => filters.actions.onOpenNew() }}
      />
      <AzuosFilterBuilderScreen
        data={filters.data}
        state={filters.state}
        actions={filters.actions}
      />
    </>
  );
}
