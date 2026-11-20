import { type Meta, type StoryObj } from '@storybook/react';

import { Camera } from 'lucide-react';
import { type ComponentProps, useState } from 'react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosAvatarCropperDialog } from './azuos-avatar-cropper-dialog.component';

/* Uma "foto" desenhada em SVG: retrato 3:4, rosto acima do centro — o caso em que o quadrado
   central automático cortava a testa. */
const PORTRAIT =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="%23e1e6f5"/><circle cx="300" cy="260" r="120" fill="%232e52b8"/><rect x="140" y="420" width="320" height="380" rx="160" fill="%232e52b8"/></svg>';

const LANDSCAPE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="%23142b69"/><circle cx="820" cy="260" r="140" fill="%23f5c518"/></svg>';

const noop = () => undefined;

type DialogProps = ComponentProps<typeof AzuosAvatarCropperDialog>;

/**
 * Como na tela "Meu perfil": o editor começa FECHADO, "Trocar foto" o abre e "Cancelar", o X ou
 * "Usar esta foto" o fecham. Os estados (enviando, falha) valem enquanto ele está aberto.
 */
function CropperDemo(props: DialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <div className="flex min-h-40 items-center justify-center">
      <AzuosActionButton
        data={{ label: 'Trocar foto' }}
        ui={{ icon: Camera, variant: 'secondary' }}
        actions={{ onClick: () => setIsOpen(true) }}
      />
      <AzuosAvatarCropperDialog
        {...props}
        state={{ ...props.state, isOpen }}
        actions={{
          onCancel: () => {
            close();
            props.actions.onCancel();
          },
          onConfirm: (selection) => {
            close();
            props.actions.onConfirm(selection);
          },
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Diálogos/AzuosAvatarCropperDialog',
  component: AzuosAvatarCropperDialog,
  args: {
    data: { imageUrl: PORTRAIT },
    state: { isOpen: false },
    actions: { onConfirm: noop, onCancel: noop },
  },
  render: (args) => <CropperDemo {...args} />,
} satisfies Meta<typeof AzuosAvatarCropperDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Foto de celular deitada: é para isso que existem os botões de girar. */
export const Landscape: Story = {
  args: { data: { imageUrl: LANDSCAPE } },
};

/** Enviando: nada fecha nem muda até terminar, para a pessoa não ficar sem saber se trocou. */
export const Saving: Story = {
  args: { state: { isOpen: true, isSaving: true } },
};

/** A falha do envio fica dentro do editor, com o motivo, e a pessoa pode tentar de novo. */
export const UploadFailed: Story = {
  args: {
    state: {
      isOpen: true,
      error: 'Não consegui salvar a foto agora. Tente de novo em instantes.',
    },
  },
};
