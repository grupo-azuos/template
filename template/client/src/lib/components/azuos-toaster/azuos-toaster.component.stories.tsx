import { type Meta, type StoryObj } from '@storybook/react';
import { toast } from 'sonner';

import { AzuosToaster } from './azuos-toaster.component';

/** Clique para disparar: cada aviso fica 5 s (pausa com o mouse em cima) e some sozinho. */
function Playground({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        className="control-md rounded-control bg-primary px-4 text-sm text-primary-foreground"
        onClick={() => (isError ? toast.error(message) : toast(message))}
      >
        Mostrar aviso
      </button>
      <AzuosToaster />
    </div>
  );
}

const meta = {
  title: 'Components/AzuosToaster',
  component: AzuosToaster,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AzuosToaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Playground message="Decisão registrada." /> };

export const Failure: Story = {
  render: () => <Playground message="Não foi possível salvar: sem conexão." isError />,
};

/** Caso limite: frase comprida quebra em linhas, sem estourar a largura do aviso. */
export const LongMessage: Story = {
  render: () => (
    <Playground message="Arquivo “reuniao-padaria-exemplo-ltda-2026-10-26-versao-final-revisada.json” importado como uma nova reunião no cadastro." />
  ),
};

export const TopCenter: Story = {
  render: () => (
    <div>
      <button type="button" onClick={() => toast('Aviso no topo.')}>
        Mostrar aviso
      </button>
      <AzuosToaster ui={{ position: 'top-center' }} />
    </div>
  ),
};
