import { fireEvent, render, screen } from '@testing-library/react';
import { Home } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './sidebar';

/* O primitivo decide entre a barra e a gaveta por `useIsMobile`; o dublê deixa cada teste escolher
   o lado sem depender do `matchMedia` do jsdom. */
const isMobile = vi.hoisted(() => ({ value: false }));

vi.mock('../../hooks/ui/use-mobile', () => ({ useIsMobile: () => isMobile.value }));

function sidebarElement(): HTMLElement {
  const found = document.querySelector('[data-slot="sidebar"]');
  if (!found) throw new Error('sidebar not rendered');

  return found as HTMLElement;
}

function StateProbe() {
  const { state, open, openMobile, isMobile: mobile } = useSidebar();

  return <output>{`${state}:${open}:${openMobile}:${mobile}`}</output>;
}

/* Lido direto do DOM: com a gaveta aberta, o Radix esconde o resto da página da árvore de
   acessibilidade, e `getByRole('status')` deixaria de achar a sonda. */
function probeText(): string {
  return document.querySelector('output')?.textContent ?? '';
}

function trigger(): HTMLElement {
  const found = document.querySelector('[data-sidebar="trigger"]');
  if (!found) throw new Error('trigger not rendered');

  return found as HTMLElement;
}

function renderSidebar(
  props: Parameters<typeof Sidebar>[0] = {},
  providerProps: Parameters<typeof SidebarProvider>[0] = {},
) {
  return render(
    <SidebarProvider {...providerProps}>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarInput placeholder="Buscar" />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Telas</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Adicionar tela" />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Início">
                    <Home />
                    <span>Início</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover aria-label="Mais" />
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#relatorios" size="sm" isActive>
                        <span>Relatórios</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#equipe">
                        <span>Equipe</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline" size="sm" tooltip={{ children: 'Tarefas' }}>
                    <span>Tarefas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild size="lg">
                    <a href="#ajuda">Ajuda</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <h3>Outras</h3>
            </SidebarGroupLabel>
            <SidebarGroupAction asChild>
              <a href="#mais">Mais</a>
            </SidebarGroupAction>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuAction asChild>
            <a href="#sair">Sair</a>
          </SidebarMenuAction>
          <SidebarMenuSubButton asChild>
            <button type="button">Perfil</button>
          </SidebarMenuSubButton>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <StateProbe />
      </SidebarInset>
    </SidebarProvider>,
  );
}

beforeEach(() => {
  isMobile.value = false;
});

afterEach(() => {
  document.cookie = 'sidebar_state=; max-age=0; path=/';
});

describe('Sidebar on the desktop', () => {
  // feliz
  it('renders every part expanded by default', () => {
    renderSidebar();

    expect(sidebarElement()).toHaveAttribute('data-state', 'expanded');
    expect(sidebarElement()).toHaveAttribute('data-collapsible', '');
    expect(probeText()).toBe('expanded:true:false:false');
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Relatórios').closest('a')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Equipe').closest('a')).toHaveAttribute('data-size', 'md');
    expect(screen.getByRole('link', { name: 'Ajuda' })).toHaveAttribute('data-size', 'lg');
    expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-sidebar="menu-skeleton-icon"]')).toHaveLength(1);
  });

  it('collapses from the trigger, the rail and the keyboard shortcut, remembering it in a cookie', () => {
    renderSidebar({ collapsible: 'icon' });

    fireEvent.click(trigger());
    expect(sidebarElement()).toHaveAttribute('data-state', 'collapsed');
    expect(sidebarElement()).toHaveAttribute('data-collapsible', 'icon');
    expect(document.cookie).toContain('sidebar_state=false');

    fireEvent.click(document.querySelector('[data-sidebar="rail"]')!);
    expect(sidebarElement()).toHaveAttribute('data-state', 'expanded');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebarElement()).toHaveAttribute('data-state', 'collapsed');

    fireEvent.keyDown(window, { key: 'b' });
    expect(sidebarElement()).toHaveAttribute('data-state', 'collapsed');
  });

  it('lets the parent control the open state', () => {
    const onOpenChange = vi.fn();
    renderSidebar({}, { open: false, onOpenChange });

    expect(sidebarElement()).toHaveAttribute('data-state', 'collapsed');

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(sidebarElement()).toHaveAttribute('data-state', 'collapsed');
  });

  it('draws the floating and inset variants on the right side', () => {
    const { unmount } = renderSidebar({ variant: 'floating', side: 'right' });
    expect(sidebarElement()).toHaveAttribute('data-variant', 'floating');
    expect(sidebarElement()).toHaveAttribute('data-side', 'right');
    unmount();

    renderSidebar({ variant: 'inset' });
    expect(sidebarElement()).toHaveAttribute('data-variant', 'inset');
  });

  it('draws a plain column when it cannot collapse', () => {
    renderSidebar({ collapsible: 'none' }, { defaultOpen: false });

    expect(sidebarElement()).not.toHaveAttribute('data-state');
    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  // triste
  it('refuses to be used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<StateProbe />)).toThrow(/within a SidebarProvider/);

    spy.mockRestore();
  });
});

describe('Sidebar on the phone', () => {
  beforeEach(() => {
    isMobile.value = true;
  });

  // feliz
  it('opens the menu as a sheet from the trigger', () => {
    renderSidebar();

    expect(screen.queryByText('Início')).not.toBeInTheDocument();
    expect(probeText()).toBe('expanded:true:false:true');

    fireEvent.click(trigger());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(probeText()).toBe('expanded:true:true:true');
  });

  // triste
  it('does not touch the desktop state when toggling on the phone', () => {
    renderSidebar();

    fireEvent.keyDown(window, { key: 'b', metaKey: true });

    expect(document.cookie).not.toContain('sidebar_state');
    expect(probeText()).toBe('expanded:true:true:true');
  });
});
