import { type ArchivedFilter } from '@template/shared/schemas/archive.schema';
import {
  type BoardResource,
  type DashboardScope,
  type SaveBoardInput,
  type SavedFilterList,
  type SavedFilterResource,
  type SaveFilterInput,
  type WidgetDataResource,
  type WidgetQuery,
} from '@template/shared/schemas/dashboard-board.schema';

import { apiRequest, apiUrl } from './http-client';

/** Os dashboards montados e os filtros salvos — sempre do servidor. */
export const dashboardBoardsApi = {
  board: (scope: DashboardScope): Promise<BoardResource> =>
    apiRequest(`/dashboard-boards/${scope}`),

  saveBoard: (scope: DashboardScope, body: SaveBoardInput): Promise<BoardResource> =>
    apiRequest(`/dashboard-boards/${scope}`, { method: 'PUT', body }),

  data: (query: WidgetQuery): Promise<WidgetDataResource> =>
    apiRequest('/dashboard-boards/data', { method: 'POST', body: query }),

  /** O fluxo em tempo real: um evento `dashboard` a cada mudança nos números. */
  streamUrl: (): string => apiUrl('/dashboard-boards/stream'),

  filters: (archived: ArchivedFilter = 'hide'): Promise<SavedFilterList> =>
    apiRequest('/dashboard-filters', { query: { archived } }),

  createFilter: (body: SaveFilterInput): Promise<SavedFilterResource> =>
    apiRequest('/dashboard-filters', { method: 'POST', body }),

  updateFilter: (id: string, body: SaveFilterInput): Promise<SavedFilterResource> =>
    apiRequest(`/dashboard-filters/${id}`, { method: 'PUT', body }),

  archiveFilter: (id: string): Promise<SavedFilterResource> =>
    apiRequest(`/dashboard-filters/${id}`, { method: 'DELETE' }),

  restoreFilter: (id: string): Promise<SavedFilterResource> =>
    apiRequest(`/dashboard-filters/${id}/restore`, { method: 'POST' }),
};
