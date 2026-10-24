import { Link } from '@tanstack/react-router';
import { LogOut, Menu } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { AzuosAppShellAvatar } from '../azuos-app-shell-avatar/azuos-app-shell-avatar.component';
import { AzuosAppShellTargetLink } from '../azuos-app-shell-target-link/azuos-app-shell-target-link.component';
import { AzuosBrandMark } from '../azuos-brand-mark/azuos-brand-mark.component';
import { AzuosZuzu } from '../azuos-zuzu/azuos-zuzu.component';
import {
  type AppShellUser,
  isTwoColumn,
  MOBILE_BAR_ITEMS,
  type NavAction,
  type NavAreaSpec,
  type NavItem,
  type NavProfile,
} from '../../navigation/app-shell-navigation';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

/**
 * O MENU DA CASCA PADRÃO NO CELULAR — igual nos 13 sistemas e travado pelo hook
 * `protect-app-shell.mjs` (skill `app-shell-standard`).
 *
 * Uma barra fixa embaixo, ao alcance do polegar: os 3 primeiros itens da parte escolhida e,
 * no quarto lugar, o ☰. O ☰ abre o menu INTEIRO numa gaveta de baixo — as partes, todas as
 * telas, os atalhos, o AzuosZuzu, o perfil e o Sair. O ☰ fica aceso quando a tela aberta não
 * está entre os 3 da barra: a pessoa nunca perde a pista de onde está.
 */
export type AzuosAppShellMobileBarProps = {
  data: {
    user: AppShellUser;
    areas: readonly NavAreaSpec[];
    items: readonly NavItem[];
    actions: readonly NavAction[];
    profile: NavProfile;
    badges?: Partial<Record<string, number>>;
  };
  state?: {
    activeKey?: string;
    activeArea?: string;
    isSigningOut?: boolean;
    signOutError?: string | null;
    /** Só para a story e o teste mostrarem a gaveta aberta. */
    isMenuOpen?: boolean;
  };
  actions: { onSelectArea: (area: string) => void; onSignOut: () => void };
};

export function AzuosAppShellMobileBar({ data, state, actions }: AzuosAppShellMobileBarProps) {
  const [isOpen, setIsOpen] = useState(Boolean(state?.isMenuOpen));
  const barItems = data.items.slice(0, MOBILE_BAR_ITEMS);
  const isMenuActive = !barItems.some((item) => item.key === state?.activeKey);
  const close = () => setIsOpen(false);

  return (
    <>
      <nav
        aria-label="Menu principal"
        className="bg-card border-border fixed inset-x-0 bottom-0 z-40 border-t px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xl md:hidden"
      >
        <ul className="grid grid-cols-4 gap-2">
          {barItems.map((item) => {
            const isActive = state?.activeKey === item.key;

            return (
              <li key={item.key} className="min-w-0">
                <Link
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  data-active={isActive}
                  className={BAR_ITEM}
                >
                  <BarIcon badge={data.badges?.[item.key]}>
                    <item.icon aria-hidden="true" />
                  </BarIcon>
                  <span className="max-w-full truncate text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}

          <li className="col-start-4 min-w-0">
            <button
              type="button"
              aria-label="Abrir o menu"
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              data-active={isMenuActive}
              onClick={() => setIsOpen(true)}
              className={BAR_ITEM}
            >
              <Menu aria-hidden="true" />
              <span className="max-w-full truncate text-xs font-medium">Menu</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="bg-sidebar text-sidebar-foreground border-sidebar-border rounded-t-surface max-h-[85svh] gap-0 overflow-y-auto p-0 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <SheetHeader className="flex-row items-center px-4 pt-4 pb-2">
            <AzuosBrandMark ui={{ size: 'sm' }} />
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Todas as telas do sistema, o seu perfil e a saída.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 px-3">
            {isTwoColumn(data.areas) ? (
              <div
                role="group"
                aria-label="Partes do sistema"
                className="rounded-box flex gap-1 bg-sidebar-accent/40 p-1"
              >
                {data.areas.map((area) => (
                  <button
                    key={area.key}
                    type="button"
                    aria-pressed={area.key === state?.activeArea}
                    onClick={() => actions.onSelectArea(area.key)}
                    className="rounded-control text-sidebar-foreground aria-pressed:bg-brand-yellow-400 aria-pressed:text-brand-blue-900 flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-xs font-semibold transition-colors [&>svg]:size-5"
                  >
                    <area.icon aria-hidden="true" />
                    <span className="max-w-full truncate">{area.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <ul className="flex flex-col gap-1">
              {data.items.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    onClick={close}
                    aria-current={state?.activeKey === item.key ? 'page' : undefined}
                    data-active={state?.activeKey === item.key}
                    className={SHEET_ROW}
                  >
                    <item.icon aria-hidden="true" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {data.badges?.[item.key] ? (
                      <span className="bg-destructive text-destructive-foreground rounded-full px-2 text-xs font-bold">
                        {data.badges?.[item.key]}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>

            {data.actions.length > 0 ? (
              <ul className="border-sidebar-border flex flex-col gap-1 border-t pt-3">
                {data.actions.map((action) => (
                  <li key={action.key}>
                    <AzuosAppShellTargetLink
                      data={{ target: action }}
                      onClick={close}
                      className={SHEET_ROW}
                    >
                      <action.icon aria-hidden="true" />
                      <span className="flex-1 truncate">{action.label}</span>
                    </AzuosAppShellTargetLink>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="border-sidebar-border pointer-events-none flex justify-center border-b">
              <AzuosZuzu data={{ pose: 'leaning' }} ui={{ size: 86, className: '-mb-1.5' }} />
            </div>

            <AzuosAppShellTargetLink
              data={{ target: data.profile }}
              onClick={close}
              aria-label="Abrir meu perfil"
              className={SHEET_ROW}
            >
              <AzuosAppShellAvatar data={data.user} />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">{data.user.name}</span>
                <span className="truncate text-xs tracking-wider uppercase opacity-70">
                  {data.user.role}
                </span>
              </span>
            </AzuosAppShellTargetLink>

            <button
              type="button"
              disabled={state?.isSigningOut}
              onClick={actions.onSignOut}
              className={SHEET_ROW}
            >
              <LogOut aria-hidden="true" />
              <span className="flex-1 text-left">{state?.isSigningOut ? 'Saindo…' : 'Sair'}</span>
            </button>

            {state?.signOutError ? (
              <p role="alert" className="px-2 text-xs">
                {state.signOutError}
              </p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* O item aceso é o único preenchido no azul da marca, como a casca no computador. */
const BAR_ITEM =
  'text-muted-foreground hover:text-foreground data-[active=true]:bg-sidebar data-[active=true]:text-sidebar-foreground rounded-box flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-1.5 transition-colors data-[active=true]:shadow-xs [&_svg]:size-5';

const SHEET_ROW =
  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-control flex min-h-12 w-full items-center gap-3 px-3 text-[1rem] transition-colors disabled:opacity-50 [&>svg]:size-5 [&>svg]:shrink-0';

/* O selo fica no canto do ícone: na barra não há espaço para ele ao lado do rótulo. */
function BarIcon({ badge, children }: { badge?: number; children: ReactNode }) {
  return (
    <span className="relative">
      {children}
      {badge ? (
        <span className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-2.5 min-w-4 rounded-full px-1 text-center text-xs leading-4 font-bold">
          {badge}
        </span>
      ) : null}
    </span>
  );
}
