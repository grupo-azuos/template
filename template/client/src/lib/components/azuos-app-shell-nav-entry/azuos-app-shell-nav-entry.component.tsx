import { useGSAP } from '@gsap/react';
import { Link } from '@tanstack/react-router';
import { useRef } from 'react';

import { highlightIn, popIn } from '../../motion/motion.util';
import { type NavItem } from '../../navigation/navigation';
import { SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

/**
 * Um item do menu lateral — extraído do `AzuosAppShell` porque a animação de "virou ativo" precisa do
 * próprio ciclo de vida do componente (um `useGSAP` por item, com `isActive` como dependência).
 * Dentro do shell, o efeito teria de olhar a lista inteira e dispararia em todo re-render.
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

  /* Ícone pulsa, fundo nasce com fade — só na TROCA para ativo. A dependência é `isActive`, então só
     dispara quando ele passa de `false` para `true`, nunca em re-render à toa. */
  useGSAP(() => {
    if (!isActive) return;

    popIn(iconRef.current);
    highlightIn(linkRef.current);
  }, [isActive]);

  return (
    <SidebarMenuItem>
      {/* `tooltip` é o que salva a barra recolhida: o ícone sozinho nem sempre diz o que é. O
          componente só o mostra quando está em modo ícone. */}
      {/* O tamanho da fonte vai como `text-[1rem]`, e NÃO como `text-base`: a paleta declara um token
          de cor chamado `base` (`--color-base`, em `tokens.css`), então o Tailwind lê `text-base`
          como COR, não como tamanho — e o menu inteiro sai pintado de quase branco sobre a barra
          clara, ou seja, invisível. */}
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={data.item.label}
        size="lg"
        className="text-[1rem] [&>svg]:size-5"
      >
        <Link ref={linkRef} to={data.item.to}>
          <Icon ref={iconRef} aria-hidden="true" />
          {/* Recolhida, a barra é só ícone: o rótulo SOME, não encolhe. Sem isto ele fica truncado em
              "T…" dentro dos 32px do botão, espremendo o ícone junto — a barra perde a leitura de
              relance e não ganha espaço nenhum. Quem diz o nome ali é o `tooltip` acima. */}
          <span className="group-data-[collapsible=icon]:hidden">{data.item.label}</span>
        </Link>
      </SidebarMenuButton>

      {/* Zero não vira selo: um "0" ao lado de cada item é ruído. O `SidebarMenuBadge` some sozinho
          quando a barra está recolhida. A cor vem do token de perigo, não de um degradê escrito à
          mão — assim ela acompanha a troca de tema. */}
      {data.badge ? (
        <SidebarMenuBadge className="bg-destructive text-destructive-foreground shadow-destructive/40 font-bold shadow-xs">
          {data.badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}
