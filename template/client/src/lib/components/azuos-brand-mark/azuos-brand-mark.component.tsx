import azuosIcon from './assets/azuos-icon.svg';
import azuosLogoWhite from './assets/azuos-logo-oficial-white.png';
import { cn } from '../../utils/cn.util';

/**
 * A marca, a partir dos ARQUIVOS OFICIAIS da marca.
 *
 * O PNG branco mantém o contraste sobre a barra azul. O ícone SVG oficial identifica a
 * marca quando a barra está recolhida, sem comprimir o nome inteiro em poucos pixels.
 * Os dois arquivos vêm do pacote azuos-brand.
 */
export type AzuosBrandMarkProps = {
  ui?: {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'full' | 'icon';
    className?: string;
  };
};

/** Larguras em px. A altura é proporcional: a logo é uma imagem, não um ícone quadrado. */
const WIDTHS = { sm: 84, md: 110, lg: 180 } as const;
const ICON_WIDTHS = { sm: 28, md: 36, lg: 48 } as const;

export function AzuosBrandMark({ ui }: AzuosBrandMarkProps) {
  const variant = ui?.variant ?? 'full';
  const size = ui?.size ?? 'md';
  const width = variant === 'icon' ? ICON_WIDTHS[size] : WIDTHS[size];
  const src = variant === 'icon' ? azuosIcon : azuosLogoWhite;

  return (
    <img
      src={src}
      width={width}
      alt="Grupo Azuos"
      className={cn('h-auto shrink-0', ui?.className)}
      style={{ width }}
    />
  );
}
