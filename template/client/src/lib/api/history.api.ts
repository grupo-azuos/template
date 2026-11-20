import { type Paginated } from '@template/shared/schemas/pagination.schema';
import { type HistoryEntry, type HistoryQuery } from '@template/shared/schemas/history.schema';

import { apiRequest } from './http-client';

/** A linha do tempo do sistema — padrão em todo sistema do grupo (regra `history-standard`). */
export const historyApi = {
  list: (query: Partial<HistoryQuery>) =>
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
      },
    }),
};
