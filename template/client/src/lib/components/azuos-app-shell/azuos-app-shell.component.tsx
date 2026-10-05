import { type ReactNode } from 'react';

import { AzuosAppShellNavEntry } from '../azuos-app-shell-nav-entry/azuos-app-shell-nav-entry.component';
import { AzuosBrandMark } from '../azuos-brand-mark/azuos-brand-mark.component';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '../ui/sidebar';
import { NAV_ITEMS, type NavItem } from '../../navigation/navigation';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';

/**
 * A casca do sistema: menu à esquerda, conteúdo à direita.
 *
 * A composição segue a documentada pelo shadcn: `SidebarMenu` dentro de `SidebarGroup` ›
 * `SidebarGroupContent`; item ativo pelo `isActive` do próprio componente (é o que põe
 * `data-active` no botão); e o `SidebarTrigger` no CONTEÚDO — dentro da barra ele sumiria
 * junto com o que colapsa, e recolhida não haveria como expandir de volta.
 *
 * A `variant` é `inset`: a página herda a cor da barra, e o conteúdo flutua como um cartão
 * arredondado por cima. A cor vem dos tokens `--sidebar-*` em `lib/theme/tokens.css` — não de
 * `className` empilhada no componente baixado.
 *
 * Os itens vêm de `lib/navigation/navigation.ts`. Tela nova no menu é uma linha lá, não aqui.
 */
export type AzuosAppShellProps = {
  children: ReactNode;
  data?: {
    /** Contador ao lado do item, pela `key` dele. Zero não desenha selo. */
    badges?: Partial<Record<string, number>>;
    user?: { name: string; email: string; role: string };
  };
  ui?: { items?: readonly NavItem[] };
  state?: { isCollapsed?: boolean; activeKey?: string };
};

export function AzuosAppShell({ children, data, ui, state }: AzuosAppShellProps) {
  const items = ui?.items ?? NAV_ITEMS;

  return (
    <SidebarProvider defaultOpen={!state?.isCollapsed}>
      {/* `collapsible="icon"` e não `offcanvas`: recolhida, a barra vira uma faixa de ícones.
          Sumir por inteiro tiraria da tela a única pista de onde estão as outras telas. */}
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          {/* A logo é a versão branca, feita para fundo escuro — por isso ela só existe aqui
              dentro, e nunca sobre o branco do conteúdo. */}
          <div className="flex items-center px-2 py-1.5 group-data-[collapsible=icon]:hidden">
            <AzuosBrandMark ui={{ size: 'sm' }} />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <AzuosAppShellNavEntry
                    key={item.key}
                    data={{ item, badge: data?.badges?.[item.key] }}
                    state={{ isActive: state?.activeKey === item.key }}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <UserEntry data={{ user: data?.user }} />
          {/* Não há botão "Sair": o template não tem login. Quem encerra a sessão é o provedor
              de identidade que fica na frente dele — um botão aqui prometeria um efeito que a
              aplicação não tem como cumprir. */}
        </SidebarFooter>

        {/* A borda arrastável: recolher também pela lateral, sem procurar o botão. */}
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="border-sidebar-border bg-background border">
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserEntry({ data }: { data: { user?: { name: string; role: string } } }) {
  const name = data.user?.name ?? 'Visitante';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={name}>
          <AzuosPersonAvatar name={name} ui={{ size: 'md' }} />
          <span className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="truncate text-xs tracking-wider uppercase opacity-70">
              {data.user?.role ?? '—'}
            </span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
