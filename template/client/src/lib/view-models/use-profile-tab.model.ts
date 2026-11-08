import { useNavigate, useSearch } from '@tanstack/react-router';
import { canManageNotifications } from '@template/shared/schemas/user.schema';

import { mockAuth } from '../auth/mock-user';

/**
 * A ABA DO PERFIL, guardada no endereço (`?tab=`): o "Ver o histórico" do sininho abre direto
 * nela, e voltar no navegador volta de aba. "O que notificar" só existe para o administrador;
 * pedida por outra pessoa, a aba vira a ficha.
 */
export type ProfileTab = 'profile' | 'notifications' | 'settings';

export type ProfileTabModel = {
  data: { tab: ProfileTab; options: { value: ProfileTab; label: string }[] };
  actions: { onChange: (tab: string) => void };
};

export function useProfileTabModel(): ProfileTabModel {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const canManage = canManageNotifications(mockAuth.getUser().role);
  const options: ProfileTabModel['data']['options'] = [
    { value: 'profile', label: 'Meu perfil' },
    { value: 'notifications', label: 'Notificações' },
    ...(canManage ? [{ value: 'settings' as const, label: 'O que notificar' }] : []),
  ];
  const tab = options.some((option) => option.value === search.tab)
    ? (search.tab as ProfileTab)
    : 'profile';

  return {
    data: { tab, options },
    actions: {
      onChange: (next) => void navigate({ to: '/profile', search: { tab: next } }),
    },
  };
}
