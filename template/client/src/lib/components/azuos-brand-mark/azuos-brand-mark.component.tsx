import azuosLogoWhite from './assets/azuos-logo-oficial-white.png';
import { cn } from '../../utils/cn.util';

/**
 * A marca, a partir dos ARQUIVOS OFICIAIS da marca.
 *
 * `azuos-logo-oficial-white.png` é o mesmo arquivo dos outros sistemas do Grupo Azuos. Ele é
 * BRANCO com o ponto amarelo, feito para fundo escuro — é por isso que só aparece sobre o
 * azul da marca, e nunca sobre o branco do conteúdo.
 *
 * Não há versão em SVG, de propósito: uma marca redesenhada à mão é pior que nenhuma — ela
 * passa por certa e vira a identidade por omissão.
 */
export type AzuosBrandMarkProps = {
  ui?: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  };
};

/** Larguras em px. A altura é proporcional: a logo é uma imagem, não um ícone quadrado. */
const WIDTHS = { sm: 84, md: 110, lg: 180 } as const;

export function AzuosBrandMark({ ui }: AzuosBrandMarkProps) {
  const width = WIDTHS[ui?.size ?? 'md'];

  return (
    <img
      src={azuosLogoWhite}
      width={width}
      alt="Grupo Azuos"
      className={cn('h-auto shrink-0', ui?.className)}
      style={{ width }}
    />
  );
}
