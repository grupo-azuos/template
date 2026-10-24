import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';

import { accountProfileUrl } from '../api/account-session.api';
import {
  activeNavItemOf,
  areaOfPath,
  navItemsOf,
  type AppShellNavigation,
  type NavProfile,
  type NavViewer,
  visibleActionsOf,
  visibleAreasOf,
} from '../navigation/app-shell-navigation';

/**
 * O MENU DA CASCA PADRÃO, resolvido a partir da rota e de quem está usando.
 *
 * Igual nos 13 sistemas e travado como o resto da casca. Cada sistema entrega só os dados
 * (`navigation.ts`) e quem está usando; a parte acesa, os itens visíveis e a troca de parte
 * saem daqui.
 *
 * Trocar de parte NÃO navega: troca a lista e deixa a pessoa onde está. A escolha vale até a
 * rota mudar — aí a parte volta a ser a da tela aberta, e o menu nunca mostra uma lista em
 * que a tela atual não está.
 */
export function useAppShellNavigationModel(config: AppShellNavigation, viewer: NavViewer) {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState<string | null>(null);
  const [choicePath, setChoicePath] = useState(pathname);

  /* A rota mudou: a escolha anterior morre aqui, e não só "deixa de valer" — senão, voltando
     para a mesma tela, a parte escolhida lá atrás reapareceria. Ajuste durante a renderização,
     o padrão do React para estado que depende de outra coisa. */
  if (choicePath !== pathname) {
    setChoicePath(pathname);
    setChoice(null);
  }

  const areas = visibleAreasOf(config.areas, config.items, viewer);
  const routeArea = areaOfPath(pathname, config.items, areas);
  const activeArea = (choicePath === pathname ? choice : null) ?? routeArea;

  return {
    data: {
      areas,
      items: navItemsOf(config.items, areas.length > 0 ? activeArea : undefined, viewer),
      actions: visibleActionsOf(config.actions, viewer),
      profile: config.profile ?? accountProfile(),
    },
    state: {
      activeKey: activeNavItemOf(pathname, config.items)?.key,
      activeArea,
      pageKey: pathname,
    },
    actions: {
      onSelectArea: (area: string) => setChoice(area),
    },
  };
}

function accountProfile(): NavProfile {
  return { href: accountProfileUrl() ?? '/' };
}
