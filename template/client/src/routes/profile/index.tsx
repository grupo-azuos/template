import { createFileRoute } from '@tanstack/react-router';

import { AzuosMyProfileView } from '../../lib/components/azuos-my-profile-view/azuos-my-profile-view.component';
import { AzuosSegmentedControl } from '../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { useNotificationHistoryModel } from '../../lib/view-models/use-notification-history.model';
import { useNotificationSettingsModel } from '../../lib/view-models/use-notification-settings.model';
import { useProfileModel } from '../../lib/view-models/use-profile.model';
import { useProfileTabModel } from '../../lib/view-models/use-profile-tab.model';
import { AzuosNotificationHistoryView } from './components/azuos-notification-history-view/azuos-notification-history-view.component';
import { AzuosNotificationSettingsView } from './components/azuos-notification-settings-view/azuos-notification-settings-view.component';

/**
 * Meu perfil — a mesma ficha, só de leitura, nos 13 sistemas. Abre pelo cartão do rodapé do
 * menu, e não pela lista: perfil não é tela de trabalho. Ao lado da ficha, o histórico de
 * notificações e, para o administrador, "O que notificar". A rota só compõe.
 */
export const Route = createFileRoute('/profile/')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const tab = useProfileTabModel();

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-10 sm:px-6">
      <AzuosSegmentedControl
        data={{ value: tab.data.tab, options: tab.data.options }}
        ui={{ ariaLabel: 'Partes do perfil' }}
        actions={{ onChange: tab.actions.onChange }}
      />
      {tab.data.tab === 'notifications' ? <HistoryTab /> : null}
      {tab.data.tab === 'settings' ? <SettingsTab /> : null}
      {tab.data.tab === 'profile' ? <ProfileTab /> : null}
    </div>
  );
}

function ProfileTab() {
  const model = useProfileModel();

  return <AzuosMyProfileView data={model.data} state={model.state} actions={model.actions} />;
}

function HistoryTab() {
  const model = useNotificationHistoryModel();

  return (
    <AzuosNotificationHistoryView data={model.data} state={model.state} actions={model.actions} />
  );
}

function SettingsTab() {
  const model = useNotificationSettingsModel();

  return (
    <AzuosNotificationSettingsView data={model.data} state={model.state} actions={model.actions} />
  );
}
