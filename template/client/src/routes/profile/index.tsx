import { createFileRoute } from '@tanstack/react-router';
import { Bell, SlidersHorizontal } from 'lucide-react';

import {
  AzuosMyProfileView,
  type MyProfileExtraSection,
} from '../../lib/components/azuos-my-profile-view/azuos-my-profile-view.component';
import { useNotificationHistoryModel } from '../../lib/view-models/use-notification-history.model';
import { useNotificationSettingsModel } from '../../lib/view-models/use-notification-settings.model';
import { useProfileModel } from '../../lib/view-models/use-profile.model';
import { useProfileTabModel } from '../../lib/view-models/use-profile-tab.model';
import { AzuosNotificationHistoryView } from './components/azuos-notification-history-view/azuos-notification-history-view.component';
import { AzuosNotificationSettingsView } from './components/azuos-notification-settings-view/azuos-notification-settings-view.component';

/**
 * Meu perfil — a mesma ficha, só de leitura, nos 13 sistemas. Abre pelo cartão do rodapé do
 * menu, e não pela lista: perfil não é tela de trabalho. As notificações e, para o
 * administrador, "O que notificar" são SEÇÕES da ficha (com o índice ao lado), e não abas: a
 * pessoa vê tudo de si numa página só. A rota só compõe.
 */
export const Route = createFileRoute('/profile/')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const parts = useProfileTabModel();
  const profile = useProfileModel();
  const history = useNotificationHistoryModel({ startExpanded: parts.data.opensHistory });
  const settings = useNotificationSettingsModel();
  const sections: MyProfileExtraSection[] = [
    {
      id: 'profile-notifications',
      label: 'Notificações',
      icon: Bell,
      content: (
        <AzuosNotificationHistoryView
          data={history.data}
          state={history.state}
          actions={history.actions}
        />
      ),
    },
    ...(parts.state.canManage
      ? [
          {
            id: 'profile-notification-settings',
            label: 'O que notificar',
            icon: SlidersHorizontal,
            content: (
              <AzuosNotificationSettingsView
                data={settings.data}
                state={settings.state}
                actions={settings.actions}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <AzuosMyProfileView
      data={profile.data}
      state={profile.state}
      actions={profile.actions}
      slots={{ extraSections: sections }}
    />
  );
}
