import { type DirectoryList } from '@template/shared/schemas/user-directory.schema';

import { apiRequest } from './http-client';

/** Quem pode ser escolhido num campo de pessoa — o servidor lê do admin-console. */
export const usersApi = {
  list: () => apiRequest<DirectoryList>('/users'),
};
