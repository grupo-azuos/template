import { USER_ROLE_LABELS } from '@template/shared/schemas/user.schema';

import { mockAuth } from '../auth/mock-user';
import { useMyProfileModel } from './use-my-profile.model';

/**
 * De onde sai a ficha de "Meu perfil" NESTE sistema: a mesma pessoa fixa do menu, enquanto não
 * há provedor de identidade. Foto, cargo e departamento chegam quando o servidor os trouxer.
 */
export function useProfileModel() {
  const user = mockAuth.getUser();

  return useMyProfileModel({
    person: {
      name: user.name,
      email: user.email,
      roleLabel: USER_ROLE_LABELS[user.role],
      avatarUrl: null,
      jobTitle: null,
      department: null,
    },
    isLoading: false,
    error: null,
  });
}
