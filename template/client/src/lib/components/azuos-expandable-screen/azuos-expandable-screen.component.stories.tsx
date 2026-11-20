import { type Meta, type StoryObj } from '@storybook/react';
import { Maximize2 } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { fn } from 'storybook/test';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosExpandableScreen } from './azuos-expandable-screen.component';

type ScreenProps = ComponentProps<typeof AzuosExpandableScreen>;

/**
 * A tela de verdade, como numa página: um botão a EXPANDE, e o X, o Esc ou o "Cancelar" a FECHAM.
 * Sem isso a história ficava presa aberta, por cima da página, e o X não fazia nada.
 */
function ExpandableScreenDemo({ withFooter, ...props }: ScreenProps & { withFooter?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => {
    setIsOpen(false);
    props.actions.onClose();
  };

  return (
    <div className="flex min-h-40 items-center justify-center">
      <AzuosActionButton
        data={{ label: 'Montar filtro' }}
        ui={{ icon: Maximize2 }}
        actions={{ onClick: () => setIsOpen(true) }}
      />
      <AzuosExpandableScreen
        {...props}
        state={{ isOpen }}
        actions={{ onClose: close }}
        footer={
          withFooter ? (
            <>
              <AzuosActionButton
                data={{ label: 'Cancelar' }}
                ui={{ variant: 'secondary' }}
                actions={{ onClick: close }}
              />
              <AzuosActionButton data={{ label: 'Salvar filtro' }} actions={{ onClick: close }} />
            </>
          ) : undefined
        }
      />
    </div>
  );
}

const meta = {
  title: 'Conteúdo e marcadores/AzuosExpandableScreen',
  component: AzuosExpandableScreen,
  args: {
    data: { title: 'Montar filtro', description: 'Grupos E/OU, um dentro do outro.' },
    state: { isOpen: false },
    actions: { onClose: fn() },
    children: <div className="p-6">O canvas do filtro entra aqui.</div>,
  },
  render: (args) => <ExpandableScreenDemo {...args} />,
} satisfies Meta<typeof AzuosExpandableScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clique em "Montar filtro": a tela expande por cima de tudo; o X ou o Esc fecham. */
export const Open: Story = {};

/** Com rodapé: "Cancelar" e "Salvar filtro" também fecham a tela. */
export const WithFooter: Story = {
  render: (args) => <ExpandableScreenDemo {...args} withFooter />,
};
