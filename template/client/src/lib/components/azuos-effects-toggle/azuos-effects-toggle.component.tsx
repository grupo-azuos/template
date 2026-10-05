import { Gauge, Sparkles } from 'lucide-react';

import { useEffects } from '../../hooks/use-effects/use-effects';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * O botão de efeitos visuais: completos ou leves. Irmão do `AzuosThemeToggle` e do mesmo jeito —
 * cuida da própria preferência (`lib/hooks/use-effects`), e a tela só o coloca no menu.
 *
 * O sistema já escolhe sozinho pelo que a máquina aguenta; este botão é para quem quer MANDAR:
 * forçar o modo leve num PC que a detecção achou bom, ou o completo num que ela achou fraco. Como no
 * tema, o ícone mostra o modo DE AGORA, não para onde o clique leva.
 */
export function AzuosEffectsToggle() {
  const effects = useEffects();
  const isFull = effects.level === 'full';

  return (
    <AzuosActionButton
      data={{
        label: isFull
          ? 'Efeitos visuais completos — mudar para o modo leve'
          : 'Efeitos visuais leves — mudar para o modo completo',
      }}
      ui={{
        variant: 'ghost',
        size: 'sm',
        icon: isFull ? Sparkles : Gauge,
        isIconOnly: true,
      }}
      actions={{ onClick: effects.actions.onToggle }}
    />
  );
}
