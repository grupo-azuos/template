import { type Paginated } from '@template/shared/schemas/pagination.schema';
import {
  type Notification,
  type NotificationInbox,
  type NotificationQuery,
  type NotificationReadResult,
  type NotificationSettingList,
  type UpdateNotificationSettingsInput,
} from '@template/shared/schemas/notification.schema';

import { apiRequest, apiUrl } from './http-client';

/** As notificações de quem está logado — o servidor sabe quem é; nenhuma chamada diz. */
export const notificationsApi = {
  inbox: (): Promise<NotificationInbox> => apiRequest('/notifications/inbox'),

  page: (query: Partial<NotificationQuery>): Promise<Paginated<Notification>> =>
    apiRequest('/notifications', {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
        severity: query.severity,
        topic: query.topic,
        search: query.search,
        from: query.from,
        to: query.to,
      },
    }),

  markRead: (id: string): Promise<Notification> =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),

  markManyRead: (ids: readonly string[]): Promise<NotificationReadResult> =>
    apiRequest('/notifications/read', { method: 'POST', body: { ids } }),

  markAllRead: (): Promise<NotificationReadResult> =>
    apiRequest('/notifications/read-all', { method: 'POST' }),

  settings: (): Promise<NotificationSettingList> => apiRequest('/notifications/settings'),

  saveSettings: (body: UpdateNotificationSettingsInput): Promise<NotificationSettingList> =>
    apiRequest('/notifications/settings', { method: 'PUT', body }),

  /** O fluxo em tempo real (SSE). O navegador reconecta sozinho quando cai. */
  streamUrl: (): string => apiUrl('/notifications/stream'),
};
