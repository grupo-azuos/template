import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../../theme/theme';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * O botão de trocar entre claro e escuro. Cuida do próprio tema (`lib/theme/theme.ts`), sem precisar
 * que a rota passe estado nenhum — é por isso que ele pode ser colocado em qualquer canto do menu
 * sem a tela em volta saber que existe um tema.
 *
 * Ícone de lua quando está escuro, sol quando está claro: o ícone mostra o tema DE AGORA, não para
 * onde o clique leva. É a mesma leitura de um interruptor — ele mostra o estado, não o destino.
 */
export function AzuosThemeToggle() {
  const { theme, actions } = useTheme();
  const isDark = theme === 'dark';

  return (
    <AzuosActionButton
      data={{ label: isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro' }}
      ui={{ variant: 'ghost', size: 'sm', icon: isDark ? Moon : Sun, isIconOnly: true }}
      actions={{ onClick: actions.onToggle }}
    />
  );
}
