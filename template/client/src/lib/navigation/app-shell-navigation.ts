import { type LucideIcon } from 'lucide-react';

/**
 * O CONTRATO DO MENU — igual, byte a byte, nos 13 sistemas do Grupo Azuos.
 *
 * Este arquivo é da casca padrão (skill `app-shell-standard`) e é TRAVADO pelo hook
 * `protect-app-shell.mjs`: só quem administra (`git config azuos.admin true`) muda. O sistema
 * diz O QUE vai no menu em `navigation.ts`, só com dados nestes formatos; COMO o menu se
 * desenha é decidido aqui e no `AzuosAppShell`, e não muda de um sistema para outro.
 *
 * A forma do menu sai dos dados, nunca de uma escolha local:
 *  - menos de duas partes visíveis → UMA coluna (ícone + rótulo; recolhida, só ícone);
 *  - duas partes ou mais → DUAS colunas (trilho de ícones com as partes + painel com rótulos).
 */

/** Uma tela do menu. `to` é a rota do TanStack Router; o item acende também nas subrotas. */
export type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** A parte (contexto) em que o item aparece. Sem partes, fica vazio. */
  area?: string;
  /** Some do menu de quem não é administrador — a rota e o servidor recusam por conta própria. */
  isAdminOnly?: boolean;
};

/** Uma parte (contexto) do sistema: vira um ícone do trilho, com o nome na dica. */
export type NavAreaSpec = {
  key: string;
  label: string;
  icon: LucideIcon;
  isAdminOnly?: boolean;
};

/** Destino de um atalho: rota interna (`to`) ou endereço de fora (`href`). */
export type NavTarget = { to: string } | { href: string; opensInNewTab?: boolean };

/** Atalho do rodapé, acima do perfil (ex.: "Abrir chamado", "Painel de TV"). */
export type NavAction = NavTarget & {
  key: string;
  label: string;
  icon: LucideIcon;
  isAdminOnly?: boolean;
};

/** Para onde o cartão de perfil leva. */
export type NavProfile = NavTarget;

export type NavViewer = { isAdmin: boolean };

/**
 * O que cada sistema exporta em `navigation.ts` como `NAVIGATION` — só dados.
 * Sem `profile`, o cartão de perfil leva ao perfil do admin-console.
 */
export type AppShellNavigation = {
  areas: readonly NavAreaSpec[];
  items: readonly NavItem[];
  actions: readonly NavAction[];
  profile?: NavProfile;
};

/** Quem está usando, como o rodapé mostra: foto (ou iniciais), nome e papel. */
export type AppShellUser = { name: string; role: string; avatarUrl?: string | null };

/** A menor quantidade de partes que pede o formato de duas colunas. */
export const TWO_COLUMN_MIN_AREAS = 2;

/** No celular, a barra de baixo mostra estes itens; o resto mora no menu (☰). */
export const MOBILE_BAR_ITEMS = 3;

function isVisible(entry: { isAdminOnly?: boolean }, viewer: NavViewer): boolean {
  return !entry.isAdminOnly || viewer.isAdmin;
}

/** Os itens de uma parte — sem partes no sistema, todos —, sem o que este perfil não vê. */
export function navItemsOf(
  items: readonly NavItem[],
  area: string | undefined,
  viewer: NavViewer,
): NavItem[] {
  return items
    .filter((item) => area === undefined || item.area === undefined || item.area === area)
    .filter((item) => isVisible(item, viewer));
}

/** As partes que existem DE VERDADE para este perfil: parte sem tela visível não aparece. */
export function visibleAreasOf(
  areas: readonly NavAreaSpec[],
  items: readonly NavItem[],
  viewer: NavViewer,
): NavAreaSpec[] {
  return areas
    .filter((area) => isVisible(area, viewer))
    .filter((area) => navItemsOf(items, area.key, viewer).length > 0);
}

export function visibleActionsOf(actions: readonly NavAction[], viewer: NavViewer): NavAction[] {
  return actions.filter((action) => isVisible(action, viewer));
}

/**
 * O item aceso pelo prefixo do caminho — o MAIS LONGO vence, para `/tasks/archive` acender
 * "Arquivo" e não "Tarefas", e para a ordem da lista nunca decidir sozinha.
 */
export function activeNavItemOf(
  pathname: string,
  items: readonly NavItem[],
): NavItem | undefined {
  return items
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((one, other) => other.to.length - one.to.length)[0];
}

/** A parte da rota atual; rota desconhecida fica na primeira parte visível. */
export function areaOfPath(
  pathname: string,
  items: readonly NavItem[],
  areas: readonly NavAreaSpec[],
): string | undefined {
  const area = activeNavItemOf(pathname, items)?.area;
  if (area && areas.some((spec) => spec.key === area)) return area;

  return areas[0]?.key;
}

export function isTwoColumn(areas: readonly NavAreaSpec[]): boolean {
  return areas.length >= TWO_COLUMN_MIN_AREAS;
}
