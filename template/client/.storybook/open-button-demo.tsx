import { type LucideIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { AzuosActionButton } from '../src/lib/components/azuos-action-button/azuos-action-button.component';

/**
 * O DIÁLOGO COMO NA TELA DE VERDADE: ele começa FECHADO, um botão o abre, e o que fecha (X, Esc,
 * "Cancelar", confirmar) fecha de fato. Sem isso a história ficava presa aberta por cima da
 * página Docs, e o X não fazia nada.
 */
export function OpenButtonDemo({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: (isOpen: boolean, close: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-40 items-center justify-center">
      <AzuosActionButton
        data={{ label }}
        ui={{ icon, variant: 'secondary' }}
        actions={{ onClick: () => setIsOpen(true) }}
      />
      {children(isOpen, () => setIsOpen(false))}
    </div>
  );
}
