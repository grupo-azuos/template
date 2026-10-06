import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AzuosResponsiveDialogContent } from './azuos-responsive-dialog-content.component';

const meta = {
  title: 'Diálogos/AzuosResponsiveDialogContent',
  component: AzuosResponsiveDialogContent,
} satisfies Meta<typeof AzuosResponsiveDialogContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Abra e diminua a janela da pré-visualização: acima de 640px é o modal centrado de sempre; abaixo,
 * ele nasce de baixo com a alça de arrastar.
 */
export const Default: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <AzuosActionButton data={{ label: 'Abrir' }} />
      </DialogTrigger>
      <AzuosResponsiveDialogContent>
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Os campos da tarefa entrariam aqui.</DialogDescription>
        </DialogHeader>
        <p className="text-sm">O conteúdo do diálogo.</p>
      </AzuosResponsiveDialogContent>
    </Dialog>
  ),
};

/** Conteúdo longo: rola como um bloco só, cabeçalho incluso — igual ao bottom sheet nativo. */
export const LongContent: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <AzuosActionButton data={{ label: 'Abrir' }} />
      </DialogTrigger>
      <AzuosResponsiveDialogContent>
        <DialogHeader>
          <DialogTitle>Histórico</DialogTitle>
        </DialogHeader>
        {Array.from({ length: 20 }, (_, index) => (
          <p key={index} className="text-sm">
            Linha {index + 1} do histórico.
          </p>
        ))}
      </AzuosResponsiveDialogContent>
    </Dialog>
  ),
};

/** Sem o X: para o diálogo que só sai por "Cancelar" ou "Salvar". */
export const WithoutCloseButton: Story = {
  args: {},
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <AzuosActionButton data={{ label: 'Abrir' }} />
      </DialogTrigger>
      <AzuosResponsiveDialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar</DialogTitle>
        </DialogHeader>
        <p className="text-sm">Só sai pelos botões do rodapé.</p>
      </AzuosResponsiveDialogContent>
    </Dialog>
  ),
};
