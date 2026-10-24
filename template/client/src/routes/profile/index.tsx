import { createFileRoute } from '@tanstack/react-router';

import { AzuosMyProfileView } from '../../lib/components/azuos-my-profile-view/azuos-my-profile-view.component';
import { useProfileModel } from '../../lib/view-models/use-profile.model';

/**
 * Meu perfil — a mesma ficha, só de leitura, nos 13 sistemas. Abre pelo cartão do rodapé do
 * menu, e não pela lista: perfil não é tela de trabalho. A rota só compõe.
 */
export const Route = createFileRoute('/profile/')({ component: ProfileRoute });

function ProfileRoute() {
  const model = useProfileModel();

  return <AzuosMyProfileView data={model.data} state={model.state} actions={model.actions} />;
}
