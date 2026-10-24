import { USER_ROLE_LABELS } from '@template/shared/schemas/user.schema';

import { mockAuth } from '../auth/mock-user';
import { NAVIGATION } from '../navigation/navigation';
import { useAccountSessionModel } from './use-account-session.model';
import { useAppShellNavigationModel } from './use-app-shell-navigation.model';

/**
 * O que a casca padrão precisa DESTE sistema: quem está usando, os contadores do menu e a
 * saída. O menu em si (item aceso, parte escolhida, visíveis por perfil) vem do
 * `useAppShellNavigationModel`, igual nos 13 sistemas.
 *
 * Contador de menu é buscado AQUI, uma vez, e não em cada rota. Falha de contador não derruba o
 * menu: o selo simplesmente não aparece.
 */
export function useAppShellModel() {
  const user = mockAuth.getUser();
  const navigation = useAppShellNavigationModel(NAVIGATION, { isAdmin: user.role === 'admin' });
  const session = useAccountSessionModel();

  return {
    data: {
      ...navigation.data,
      user: { name: user.name, role: USER_ROLE_LABELS[user.role] },
      badges: {},
    },
    state: {
      ...navigation.state,
      isSigningOut: session.state.isSigningOut,
      signOutError: session.state.error,
    },
    actions: {
      onSelectArea: navigation.actions.onSelectArea,
      onSignOut: session.actions.onSignOut,
    },
  };
}
