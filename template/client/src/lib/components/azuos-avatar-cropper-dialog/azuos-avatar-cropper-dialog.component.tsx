import { Check, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';
import { AzuosSliderField } from '../azuos-slider-field/azuos-slider-field.component';

/**
 * O EDITOR DA FOTO DE PERFIL — cortar, aproximar e girar antes de enviar.
 *
 * O recorte em si é do `react-easy-crop` (arrastar, pinça no celular, roda do mouse, setas do
 * teclado); o modal é do shadcn/ui e o zoom, o `AzuosSliderField` sobre o Slider do Radix. Este componente só os junta e
 * devolve a escolha: a área em pixels e a rotação. Quem transforma isso em imagem é o
 * view-model — a tela não lê arquivo nem desenha canvas.
 *
 * Posição, zoom e rotação são estado PURAMENTE visual enquanto a pessoa ajusta (CONTRIBUTING
 * §3 permite `useState` para isso). Só o "Usar esta foto" os entrega para fora.
 */
export type AvatarCropSelection = {
  area: { x: number; y: number; width: number; height: number };
  rotation: number;
};

export type AzuosAvatarCropperDialogProps = {
  data: { imageUrl: string | null };
  state?: { isOpen?: boolean; isSaving?: boolean; error?: string | null };
  actions: {
    onConfirm: (selection: AvatarCropSelection) => void;
    onCancel: () => void;
  };
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export function AzuosAvatarCropperDialog({ data, state, actions }: AzuosAvatarCropperDialogProps) {
  const isSaving = Boolean(state?.isSaving);

  return (
    <Dialog
      open={Boolean(state?.isOpen && data.imageUrl)}
      /* Fechar no meio do envio deixaria a pessoa sem saber se a foto trocou. */
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSaving) actions.onCancel();
      }}
    >
      {/* O diálogo é `fixed` e centralizado, sem altura máxima: deitado no celular (≈380px de
          altura) o recorte, o zoom e os dois botões não cabiam, e o que sobrava ficava fora
          da tela SEM rolagem — não havia como salvar. `max-h`+`overflow-y-auto` devolvem a
          rolagem por dentro; `svh` porque `vh` desconta a barra de endereço escondida. */}
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-y-auto p-4 sm:max-w-lg sm:p-6"
        showCloseButton={!isSaving}
      >
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e use o zoom para enquadrar o rosto no círculo.
          </DialogDescription>
        </DialogHeader>

        {/* A chave recomeça o ajuste a cada imagem: zoom e posição da foto anterior não servem
            para a próxima. */}
        {data.imageUrl ? (
          <CropEditor
            key={data.imageUrl}
            data={{ imageUrl: data.imageUrl }}
            state={{ isSaving, error: state?.error ?? null }}
            actions={actions}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CropEditor({
  data,
  state,
  actions,
}: {
  data: { imageUrl: string };
  state: { isSaving: boolean; error: string | null };
  actions: AzuosAvatarCropperDialogProps['actions'];
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Mais baixo no celular: 288px de recorte mais o cabeçalho, o zoom e os botões não
          cabem numa tela de 640px de altura sem empurrar "Salvar" para fora da dobra. */}
      <div className="bg-ink-900 rounded-box relative h-56 w-full overflow-hidden sm:h-72">
        <Cropper
          image={data.imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_percentages, pixels) => setArea(pixels)}
        />
      </div>

      <AzuosSliderField
        data={{ label: 'Zoom', value: zoom, min: MIN_ZOOM, max: MAX_ZOOM, step: 0.05 }}
        ui={{
          startIcon: <ZoomOut className="text-ink-500 size-4 shrink-0" aria-hidden />,
          endIcon: <ZoomIn className="text-ink-500 size-4 shrink-0" aria-hidden />,
        }}
        state={{ isDisabled: state.isSaving }}
        actions={{ onChange: setZoom }}
      />

      <div className="flex justify-center gap-2">
        <AzuosActionButton
          data={{
            label: 'Girar para a esquerda',
          }}
          ui={{ icon: RotateCcw, size: 'sm' }}
          state={{ isDisabled: state.isSaving }}
          actions={{ onClick: () => setRotation((current) => normalizeRotation(current - 90)) }}
        />
        <AzuosActionButton
          data={{
            label: 'Girar para a direita',
          }}
          ui={{ icon: RotateCw, size: 'sm' }}
          state={{ isDisabled: state.isSaving }}
          actions={{ onClick: () => setRotation((current) => normalizeRotation(current + 90)) }}
        />
      </div>

      {state.error ? (
        <AzuosErrorState data={{ message: state.error }} ui={{ variant: 'inline' }} />
      ) : null}

      <DialogFooter>
        <AzuosActionButton
          data={{ label: 'Cancelar' }}
          state={{ isDisabled: state.isSaving }}
          actions={{ onClick: actions.onCancel }}
        />
        <AzuosActionButton
          data={{
            label: 'Usar esta foto',
            loadingLabel: 'Enviando…',
          }}
          ui={{ icon: Check, variant: 'primary' }}
          /* Sem área medida ainda (a imagem não terminou de carregar) não há o que cortar. */
          state={{ isLoading: state.isSaving, isDisabled: area === null }}
          actions={{ onClick: () => area && actions.onConfirm({ area, rotation }) }}
        />
      </DialogFooter>
    </div>
  );
}

/** Sempre entre 0 e 359: girar quatro vezes volta ao começo, e não para 360 ou -90. */
export function normalizeRotation(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
