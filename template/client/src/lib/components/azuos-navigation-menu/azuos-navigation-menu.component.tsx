import { cn } from '../../utils/cn.util';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '../ui/navigation-menu';

/**
 * Uma fileira de links de seção (Visão geral · Histórico · Anexos) para navegar DENTRO de uma tela.
 * Envolve o `ui/navigation-menu` do shadcn. O menu do sistema inteiro é a barra lateral
 * (`AzuosAppShell`); este aqui é para as abas de uma página.
 *
 * São links de VERDADE (`href`), e não botões: a pessoa pode abrir numa aba nova e o endereço diz
 * onde ela está. Quem sabe qual é o item atual é a tela, que marca `isActive`.
 */
export type AzuosNavigationMenuEntry = { label: string; href: string; isActive?: boolean };

export type AzuosNavigationMenuProps = {
  data: { items: AzuosNavigationMenuEntry[] };
  ui: {
    /** O que este menu navega, para quem usa leitor de tela. */
    ariaLabel: string;
    className?: string;
  };
};

export function AzuosNavigationMenu({ data, ui }: AzuosNavigationMenuProps) {
  /* Menu sem itens não é um menu: nada é desenhado. */
  if (data.items.length === 0) return null;

  return (
    /* `viewport={false}`: não há submenu para abrir, então a caixa flutuante do shadcn não entra. */
    <NavigationMenu aria-label={ui.ariaLabel} viewport={false} className={ui.className}>
      <NavigationMenuList className="flex-wrap gap-1">
        {data.items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              href={item.href}
              active={item.isActive}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                'control-md rounded-control flex-row items-center text-sm font-medium',
                item.isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-700 hover:text-ink-900',
              )}
            >
              {item.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
