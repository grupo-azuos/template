import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { type CSSProperties, type ReactNode, useRef } from 'react';

import { AzuosAppShellAvatar } from '../azuos-app-shell-avatar/azuos-app-shell-avatar.component';
import { AzuosAppShellMobileBar } from '../azuos-app-shell-mobile-bar/azuos-app-shell-mobile-bar.component';
import { AzuosAppShellNavEntry } from '../azuos-app-shell-nav-entry/azuos-app-shell-nav-entry.component';
import { AzuosAppShellTargetLink } from '../azuos-app-shell-target-link/azuos-app-shell-target-link.component';
import { AzuosBrandMark } from '../azuos-brand-mark/azuos-brand-mark.component';
import { AzuosZuzu } from '../azuos-zuzu/azuos-zuzu.component';
import { prefersReducedMotion } from '../../motion/motion.util';
import { useSlidingIndicator } from '../../motion/use-sliding-indicator';
import {
  type AppShellUser,
  isTwoColumn,
  type NavAction,
  type NavAreaSpec,
  type NavItem,
  type NavProfile,
} from '../../navigation/app-shell-navigation';
import { cn } from '../../utils/cn.util';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

/**
 * A CASCA PADRÃO DO GRUPO AZUOS — a mesma, byte a byte, nos 13 sistemas.
 *
 * Skill `app-shell-standard`. Este arquivo é TRAVADO pelo hook `protect-app-shell.mjs`: só
 * quem administra (`git config azuos.admin true`) muda. O sistema entrega DADOS (o menu em
 * `lib/navigation/navigation.ts`, quem está usando, a saída); a forma é sempre esta:
 *
 * COMPUTADOR — barra azul à esquerda (`variant="inset"`, `collapsible="icon"`):
 *  - sem partes (ou uma só) → UMA coluna: logo, itens com ícone + rótulo, e no rodapé o
 *    AzuosZuzu, os atalhos, o perfil e o Sair. Recolhida, tudo vira ícone com dica.
 *  - com duas partes ou mais → DUAS colunas: o trilho de ícones (logo, partes, e no rodapé
 *    atalhos, foto e Sair) e o painel com os itens da parte escolhida, rotulados, com o
 *    AzuosZuzu no pé. Recolhida, sobra só o trilho — com os itens da parte em ícone.
 *
 * CELULAR — sem barra lateral: uma barra fixa embaixo com 3 itens + ☰, e o ☰ abre o menu
 * inteiro numa gaveta de baixo (`AzuosAppShellMobileBar`).
 *
 * A moldura tem a altura da tela e não rola; quem rola é a caixa do conteúdo. Com o `<body>`
 * parado, a trava de rolagem dos menus do Radix não joga a página para o topo no Safari.
 */
export type AzuosAppShellProps = {
  children: ReactNode;
  data: {
    user: AppShellUser;
    /** As partes VISÍVEIS (já filtradas). Duas ou mais desenham o formato de duas colunas. */
    areas: readonly NavAreaSpec[];
    /** Os itens da parte escolhida (ou todos, sem partes), já filtrados por perfil. */
    items: readonly NavItem[];
    /** Atalhos do rodapé, acima do perfil. */
    actions: readonly NavAction[];
    profile: NavProfile;
    /** Contador ao lado do item, pela `key`. Zero não desenha selo. */
    badges?: Partial<Record<string, number>>;
  };
  state?: {
    activeKey?: string;
    activeArea?: string;
    /** O endereço da tela aberta: quando muda, a tela nova entra com a transição. */
    pageKey?: string;
    isCollapsed?: boolean;
    isSigningOut?: boolean;
    signOutError?: string | null;
  };
  actions: {
    /** Trocar de parte NÃO navega: só troca a lista do menu. */
    onSelectArea: (area: string) => void;
    onSignOut: () => void;
  };
};

type ShellParts = Omit<AzuosAppShellProps, 'children'>;

/* Duas colunas: o trilho tem a largura da barra recolhida, e o painel, a de sempre. */
/* Trilho (ícone + a folga do `inset`, que ele ocupa por inteiro) + painel de 16rem. */
const TWO_COLUMN_WIDTH = { '--sidebar-width': 'calc(var(--sidebar-width-icon) + 1rem + 2px + 16rem)' } as CSSProperties;
const RAIL_WIDTH = 'w-[calc(var(--sidebar-width-icon)+1rem+2px)]!';

export function AzuosAppShell({ children, data, state, actions }: AzuosAppShellProps) {
  const twoColumn = isTwoColumn(data.areas);

  return (
    <SidebarProvider
      defaultOpen={!state?.isCollapsed}
      className="h-svh overflow-hidden"
      style={twoColumn ? TWO_COLUMN_WIDTH : undefined}
    >
      <ShellFrame data={data} state={state} actions={actions} twoColumn={twoColumn}>
        {children}
      </ShellFrame>
    </SidebarProvider>
  );
}

/* Separado da casca porque `useSidebar` só existe abaixo do `SidebarProvider`. */
function ShellFrame({
  children,
  data,
  state,
  actions,
  twoColumn,
}: AzuosAppShellProps & { twoColumn: boolean }) {
  const { isMobile } = useSidebar();

  return (
    <>
      {isMobile ? null : twoColumn ? (
        <TwoColumnSidebar data={data} state={state} actions={actions} />
      ) : (
        <OneColumnSidebar data={data} state={state} actions={actions} />
      )}

      <SidebarInset className="border-sidebar-border bg-background min-w-0 overflow-hidden md:border">
        {/* O gatilho vive no conteúdo: dentro da barra ele sumiria junto com o que colapsa.
            No celular não há barra lateral — o menu é a barra de baixo. */}
        <header className="hidden h-12 shrink-0 items-center gap-2 px-4 md:flex">
          <SidebarTrigger aria-label="Recolher ou expandir o menu" className="size-9" />
        </header>

        <PageTransition pageKey={state?.pageKey}>{children}</PageTransition>
      </SidebarInset>

      {isMobile ? <AzuosAppShellMobileBar data={data} state={state} actions={actions} /> : null}
    </>
  );
}

function OneColumnSidebar({ data, state, actions }: ShellParts) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        {/* A logo branca é feita para o azul da barra; recolhida, fica só o símbolo. */}
        <div className="flex items-center px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <AzuosBrandMark ui={{ size: 'sm' }} />
        </div>
        <div className="hidden items-center justify-center py-1.5 group-data-[collapsible=icon]:flex">
          <AzuosBrandMark ui={{ size: 'sm', variant: 'icon' }} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <PageNav data={data} state={state} />
          </SidebarGroupContent>
        </SidebarGroup>
        <ShortcutsGroup data={{ actions: data.actions }} />
      </SidebarContent>

      <SidebarFooter>
        {/* O AzuosZuzu debruçado na beirada, e embaixo dela quem está usando e o Sair. */}
        <ZuzuLedge />
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={data.user.name} className={ICON_SAFE}>
              <AzuosAppShellTargetLink data={{ target: data.profile }} aria-label="Abrir meu perfil">
                <AzuosAppShellAvatar data={data.user} />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">{data.user.name}</span>
                  <span className="truncate text-xs tracking-wider uppercase opacity-70">
                    {data.user.role}
                  </span>
                </span>
              </AzuosAppShellTargetLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              disabled={state?.isSigningOut}
              onClick={actions.onSignOut}
              className={ICON_SAFE}
            >
              <LogOut aria-hidden="true" />
              <span>{state?.isSigningOut ? 'Saindo…' : 'Sair'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SignOutError state={state} />
      </SidebarFooter>

      {/* A borda arrastável: recolher também pela lateral, sem procurar o botão. */}
      <SidebarRail />
    </Sidebar>
  );
}

function TwoColumnSidebar({ data, state, actions }: ShellParts) {
  const activeArea = data.areas.find((area) => area.key === state?.activeArea) ?? data.areas[0];

  return (
    /* O padrão de barras aninhadas do shadcn: a de fora recolhe para a largura de ícone, e
       com isso o painel some e sobra o trilho. As de dentro não recolhem por conta própria. */
    <Sidebar
      collapsible="icon"
      variant="inset"
      /* `p-0!`: o trilho vai até a borda da tela, de cima a baixo. A folga do `inset` (8px só
         de um lado) deixava os ícones fora do centro do trilho. */
      className="overflow-hidden p-0! *:data-[sidebar=sidebar]:flex-row"
    >
      <Sidebar
        collapsible="none"
        aria-label="Partes do sistema"
        /* O trilho num azul mais escuro que o painel: é o primeiro nível (a parte), e o painel o
           segundo (a tela). A diferença de cor já separa as colunas — sem linha divisória. */
        className={cn(RAIL_WIDTH, 'bg-brand-blue-900!')}
      >
        <SidebarHeader className="items-center px-0 pt-3">
          {/* A logo como ícone de app: um ladrilho de canto arredondado no azul do painel. */}
          <div className="bg-sidebar rounded-box flex size-10 items-center justify-center">
            <AzuosBrandMark ui={{ size: 'sm', variant: 'icon' }} />
          </div>
        </SidebarHeader>

        <SidebarContent className="items-center gap-1 px-0 py-2">
          <AreaRail data={{ areas: data.areas, activeKey: activeArea?.key }} actions={actions} />

          {/* Recolhida, o painel some: os itens da parte escolhida descem para o trilho. */}
          <div className="hidden flex-col items-center gap-1 group-data-[collapsible=icon]:flex">
            <SidebarSeparator className="my-1 h-px w-6" />
            <nav aria-label="Menu principal" className="flex flex-col items-center gap-1">
              {data.items.map((item) => (
                <RailHint key={item.key} label={item.label}>
                  <AzuosAppShellTargetLink
                    data={{ target: { to: item.to } }}
                    aria-label={item.label}
                    aria-current={state?.activeKey === item.key ? 'page' : undefined}
                    data-active={state?.activeKey === item.key}
                    className={RAIL_BUTTON}
                  >
                    <item.icon aria-hidden="true" />
                  </AzuosAppShellTargetLink>
                </RailHint>
              ))}
            </nav>
          </div>
        </SidebarContent>

        <SidebarFooter className="items-center gap-1 px-0">
          {data.actions.map((action) => (
            <RailHint key={action.key} label={action.label}>
              <AzuosAppShellTargetLink
                data={{ target: action }}
                aria-label={action.label}
                className={RAIL_BUTTON}
              >
                <action.icon aria-hidden="true" />
              </AzuosAppShellTargetLink>
            </RailHint>
          ))}

          <RailHint label={data.user.name}>
            <AzuosAppShellTargetLink
              data={{ target: data.profile }}
              aria-label="Abrir meu perfil"
              className={RAIL_BUTTON}
            >
              <AzuosAppShellAvatar data={data.user} />
            </AzuosAppShellTargetLink>
          </RailHint>

          <RailHint label={state?.isSigningOut ? 'Saindo…' : 'Sair'}>
            <button
              type="button"
              aria-label="Sair"
              disabled={state?.isSigningOut}
              onClick={actions.onSignOut}
              className={RAIL_BUTTON}
            >
              <LogOut aria-hidden="true" />
            </button>
          </RailHint>
        </SidebarFooter>
      </Sidebar>

      {/* Sem logo no painel: a marca já está no trilho (o "S" no ladrilho), e o painel começa
          direto no nome da parte. */}
      <Sidebar collapsible="none" className="hidden min-w-0 flex-1 pt-3 pb-2 md:flex">

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold tracking-wider uppercase">
              {activeArea?.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <PageNav data={data} state={state} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <ZuzuLedge />
          <div className="grid px-2 pb-1 leading-tight">
            <span className="truncate text-sm font-semibold">{data.user.name}</span>
            <span className="truncate text-xs tracking-wider uppercase opacity-70">
              {data.user.role}
            </span>
          </div>
          <SignOutError state={state} />
        </SidebarFooter>
      </Sidebar>

      <SidebarRail />
    </Sidebar>
  );
}

/* Recolhida, o `lg` do shadcn zera o padding: o rótulo sai e o ícone vai ao centro. */
/**
 * Os ATALHOS (Painel de TV, Abrir chamado…) no fim da lista, presos acima do Zuzu: o mesmo
 * tamanho dos itens do menu, com um título separando o que é tela do que é atalho. Abre em outra
 * aba? A setinha avisa. Recolhida, o título some e o atalho vira ícone com o nome na dica.
 */
function ShortcutsGroup({ data }: { data: { actions: ShellParts['data']['actions'] } }) {
  if (data.actions.length === 0) return null;

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-semibold tracking-wider uppercase">
        Atalhos
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu aria-label="Atalhos" className="gap-1">
          {data.actions.map((action) => (
            <SidebarMenuItem key={action.key}>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip={action.label}
                className={cn(ICON_SAFE, 'text-[1rem] [&>svg]:size-5')}
              >
                <AzuosAppShellTargetLink data={{ target: action }}>
                  <action.icon aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate">{action.label}</span>
                    {'opensInNewTab' in action && action.opensInNewTab ? (
                      <ArrowUpRight aria-hidden="true" className="text-sidebar-foreground/60 size-3.5 shrink-0" />
                    ) : null}
                  </span>
                </AzuosAppShellTargetLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const ICON_SAFE =
  'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span:last-child]:hidden';

const RAIL_BUTTON =
  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-box flex size-9 shrink-0 items-center justify-center outline-hidden transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5';

/* A parte escolhida é a única em amarelo, com o ícone no azul mais escuro — branco sobre o
   amarelo da marca não passa no contraste. O amarelo é o destaque que DESLIZA (`AreaRail`); o
   botão só troca a cor do ícone, e não pinta fundo no hover para não brigar com o destaque. */
const AREA_SELECTED =
  'aria-pressed:text-brand-blue-900 aria-pressed:hover:bg-transparent aria-pressed:hover:text-brand-blue-900';

/** As partes no trilho, com o amarelo deslizando de uma para a outra na troca. */
function AreaRail({
  data,
  actions,
}: {
  data: { areas: ShellParts['data']['areas']; activeKey: string | undefined };
  actions: ShellParts['actions'];
}) {
  const railRef = useSlidingIndicator<HTMLDivElement>({
    selector: '[aria-pressed="true"]',
    indicatorClass: 'rounded-box bg-brand-yellow-400',
    attributes: ['aria-pressed'],
  });

  return (
    <div ref={railRef} role="group" aria-label="Partes" className="flex flex-col items-center gap-1">
      {data.areas.map((area) => (
        <RailHint key={area.key} label={area.label}>
          <button
            type="button"
            aria-label={area.label}
            aria-pressed={area.key === data.activeKey}
            onClick={() => actions.onSelectArea(area.key)}
            className={cn(RAIL_BUTTON, AREA_SELECTED)}
          >
            <area.icon aria-hidden="true" />
          </button>
        </RailHint>
      ))}
    </div>
  );
}

/** As telas, com o destaque da tela aberta deslizando de um item para o outro na troca. */
function PageNav({ data, state }: Pick<ShellParts, 'data' | 'state'>) {
  const navRef = useSlidingIndicator<HTMLElement>({
    selector: '[aria-current="page"]',
    indicatorClass: 'rounded-box bg-sidebar-accent',
    attributes: ['aria-current'],
  });

  return (
    <nav ref={navRef} aria-label="Menu principal">
      <SidebarMenu className="gap-1">
        {data.items.map((item) => (
          <AzuosAppShellNavEntry
            key={item.key}
            data={{ item, badge: data.badges?.[item.key] }}
            state={{ isActive: state?.activeKey === item.key }}
          />
        ))}
      </SidebarMenu>
    </nav>
  );
}

/* No trilho a dica aparece SEMPRE, aberto ou recolhido: ali só há ícones. */
function RailHint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" align="center">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/* A BEIRADA em que o AzuosZuzu se debruça: a pose `leaning` pede uma linha embaixo, e a
   imagem desce sobre a borda para as asas cruzarem a linha. Parado, e só com a barra aberta —
   recolhida não há largura, e mascote cortado ao meio não é carinho. */
function ZuzuLedge() {
  return (
    <div className="border-sidebar-border pointer-events-none flex justify-center border-b group-data-[collapsible=icon]:hidden">
      <AzuosZuzu data={{ pose: 'leaning' }} ui={{ size: 86, className: '-mb-1.5' }} />
    </div>
  );
}

function SignOutError({ state }: { state: ShellParts['state'] }) {
  if (!state?.signOutError) return null;

  return (
    <p role="alert" className="text-sidebar-foreground px-2 text-xs group-data-[collapsible=icon]:sr-only">
      {state.signOutError}
    </p>
  );
}

/**
 * A troca de tela entra num esmaecer curto, em vez de piscar. Só opacidade: um deslocamento no
 * pai tiraria do lugar janelas e avisos `fixed` das telas. A caixa é quem rola — `min-h-0`
 * deixa o item de flex encolher, e `overscroll-contain` impede o "quique" de puxar a página.
 * No celular, o fim do conteúdo desconta a barra de baixo.
 */
function PageTransition({ pageKey, children }: { pageKey?: string; children: ReactNode }) {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (pageKey === undefined || prefersReducedMotion()) return;
      gsap.from(pageRef.current, { opacity: 0, duration: 0.2, ease: 'power2.out', clearProps: 'opacity' });
    },
    { dependencies: [pageKey] },
  );

  return (
    <div
      ref={pageRef}
      className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
    >
      {children}
    </div>
  );
}
