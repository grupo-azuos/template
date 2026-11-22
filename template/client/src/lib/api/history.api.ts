import { drillParam, type HistoryDrillQuery } from '@template/shared/schemas/board-drill.schema';
import { type HistoryEntry } from '@template/shared/schemas/history.schema';
import { type Paginated } from '@template/shared/schemas/pagination.schema';

import { apiRequest } from './http-client';

/** A linha do tempo do sistema — padrão em todo sistema do grupo (regra `history-standard`). */
export const historyApi = {
  list: (query: Partial<HistoryDrillQuery>) =>
    apiRequest<Paginated<HistoryEntry>>('/history', {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        targetType: query.targetType,
        action: query.action,
        actor: query.actor,
        from: query.from,
        to: query.to,
        search: query.search,
        drill: query.drill ? drillParam(query.drill) : undefined,
      },
    }),
};
