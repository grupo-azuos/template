import { useSearch } from '@tanstack/react-router';
import { canManageNotifications } from '@template/shared/schemas/user.schema';

import { mockAuth } from '../auth/mock-user';

/**
 * AS PARTES DO PERFIL — não são mais abas: "Notificações" e "O que notificar" são seções da
 * mesma ficha, com o índice ao lado. O endereço só guarda um pedido: `?tab=notifications` (o
 * "Ver o histórico" do sininho) abre a lista inteira das notificações.
 *
 * "O que notificar" só existe para o administrador.
 */
export type ProfileTabModel = {
  data: { opensHistory: boolean };
  state: { canManage: boolean };
};

export function useProfileTabModel(): ProfileTabModel {
  const search = useSearch({ strict: false }) as { tab?: string };

  return {
    data: { opensHistory: search.tab === 'notifications' },
    state: { canManage: canManageNotifications(mockAuth.getUser().role) },
  };
}
