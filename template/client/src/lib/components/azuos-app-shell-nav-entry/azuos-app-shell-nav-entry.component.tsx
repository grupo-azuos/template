import { useGSAP } from '@gsap/react';
import { Link } from '@tanstack/react-router';
import { useRef } from 'react';

import { popIn } from '../../motion/motion.util';
import { type NavItem } from '../../navigation/app-shell-navigation';
import { SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/sidebar';

/**
 * Um item do menu com ícone + rótulo — da casca padrão (skill `app-shell-standard`), igual nos
 * 13 sistemas e travado pelo hook `protect-app-shell.mjs`.
 *
 * Extraído do `AzuosAppShell` porque a animação de "virou ativo" precisa do próprio ciclo de
 * vida (um `useGSAP` por item, com `isActive` como dependência): dentro da casca, o efeito
 * olharia a lista inteira e dispararia em todo re-render.
 */
export type AzuosAppShellNavEntryProps = {
  data: { item: NavItem; badge?: number };
  state?: { isActive?: boolean };
};

export function AzuosAppShellNavEntry({ data, state }: AzuosAppShellNavEntryProps) {
  const Icon = data.item.icon;
  const iconRef = useRef<SVGSVGElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const isActive = Boolean(state?.isActive);
  const { setOpenMobile } = useSidebar();

  /* O ícone pulsa só na TROCA para ativo, nunca em re-render à toa. O fundo do ativo não é deste
     item: é o destaque que desliza no menu (`useSlidingIndicator`). */
  useGSAP(() => {
    if (!isActive) return;
    if (iconRef.current) popIn(iconRef.current);
  }, [isActive]);

  return (
    <SidebarMenuItem>
      {/* `tooltip` só aparece recolhida: aí o ícone sozinho precisa dizer o que é.
          `text-[1rem]` e não `text-base`: a paleta tem um token de cor `base`, e o Tailwind
          leria `text-base` como cor. Recolhida, o rótulo SOME e o ícone vai ao centro. */}
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={isActive}
        tooltip={data.item.label}
        className="data-[active=true]:bg-transparent! text-[1rem] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5! [&>svg]:size-5"
      >
        <Link
          ref={linkRef}
          to={data.item.to}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => setOpenMobile(false)}
        >
          <Icon ref={iconRef} aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:hidden">{data.item.label}</span>
        </Link>
      </SidebarMenuButton>

      {/* Zero não vira selo: um "0" ao lado de cada item é ruído. Some sozinho recolhida. */}
      {data.badge ? (
        <SidebarMenuBadge className="bg-destructive text-destructive-foreground font-bold shadow-xs">
          {data.badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}
