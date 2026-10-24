import { ListChecks } from 'lucide-react';

import { type AppShellNavigation } from './app-shell-navigation';

/**
 * O MENU DESTE SISTEMA — só DADOS, no formato da casca padrão (skill `app-shell-standard`).
 *
 * Tela nova no menu = UMA linha em `items`. A forma do menu NÃO se decide aqui: com menos de
 * duas partes em `areas` a barra tem uma coluna; com duas ou mais, duas colunas (trilho de
 * partes + painel de telas). Atalhos do rodapé, acima do perfil, vão em `actions`. O cartão de
 * perfil leva a `profile` — a tela "Meu perfil", igual nos 13 sistemas.
 *
 * `to` é a rota do TanStack Router (a pasta em `src/routes`). O item fica aceso também nas
 * subrotas: `/tasks/42` acende "Tarefas".
 */
export const NAVIGATION: AppShellNavigation = {
  areas: [],
  items: [{ key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks }],
  actions: [],
  profile: { to: '/profile' },
};
