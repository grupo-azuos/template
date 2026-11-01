import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosAvatarCropperDialog,
  normalizeRotation,
} from './azuos-avatar-cropper-dialog.component';

/* O `react-easy-crop` de verdade mede a imagem com `getBoundingClientRect`, que no jsdom é sempre
   zero: a área nunca seria medida e "Usar esta foto" ficaria desligado para sempre. O dublê expõe
   os mesmos avisos como botões, para o teste disparar o que a imagem carregada dispararia. */
vi.mock('react-easy-crop', () => ({
  default: ({
    zoom,
    rotation,
    onCropChange,
    onZoomChange,
    onCropComplete,
  }: {
    zoom: number;
    rotation: number;
    onCropChange: (point: { x: number; y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (
      percentages: { x: number; y: number; width: number; height: number },
      pixels: { x: number; y: number; width: number; height: number },
    ) => void;
  }) => (
    <div data-testid="cropper" data-zoom={zoom} data-rotation={rotation}>
      <button type="button" onClick={() => onCropChange({ x: 3, y: 4 })}>
        mover
      </button>
      <button type="button" onClick={() => onZoomChange(2)}>
        aproximar
      </button>
      <button
        type="button"
        onClick={() =>
          onCropComplete(
            { x: 0, y: 0, width: 100, height: 100 },
            { x: 10, y: 20, width: 300, height: 300 },
          )
        }
      >
        medir
      </button>
    </div>
  ),
}));

const IMAGE = 'blob:http://localhost/foto';

function renderDialog(state: { isOpen?: boolean; isSaving?: boolean; error?: string | null }) {
  const actions = { onConfirm: vi.fn(), onCancel: vi.fn() };

  render(<AzuosAvatarCropperDialog data={{ imageUrl: IMAGE }} state={state} actions={actions} />);

  return actions;
}

describe('AzuosAvatarCropperDialog', () => {
  // feliz
  it('opens the editor with the zoom and rotation controls', () => {
    renderDialog({ isOpen: true });

    expect(screen.getByRole('dialog', { name: 'Ajustar foto' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Girar para a direita' })).toBeInTheDocument();
  });

  it('cancels without sending anything', () => {
    const actions = renderDialog({ isOpen: true });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(actions.onCancel).toHaveBeenCalled();
    expect(actions.onConfirm).not.toHaveBeenCalled();
  });

  /* O que sai daqui é a ÁREA em pixels e a rotação — quem desenha a imagem é o view-model. */
  it('hands over the measured area and the rotation on confirm', () => {
    const actions = renderDialog({ isOpen: true });

    fireEvent.click(screen.getByRole('button', { name: 'medir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Girar para a direita' }));
    fireEvent.click(screen.getByRole('button', { name: /Usar esta foto/ }));

    expect(actions.onConfirm).toHaveBeenCalledWith({
      area: { x: 10, y: 20, width: 300, height: 300 },
      rotation: 90,
    });
  });

  it('follows the zoom and the position chosen on the picture', () => {
    renderDialog({ isOpen: true });

    fireEvent.click(screen.getByRole('button', { name: 'aproximar' }));
    fireEvent.click(screen.getByRole('button', { name: 'mover' }));

    expect(screen.getByTestId('cropper')).toHaveAttribute('data-zoom', '2');
  });

  /* Girar à esquerda a partir de zero dá 270, nunca -90: o valor vai para a imagem final. */
  it('keeps the rotation positive when turning left from zero', () => {
    renderDialog({ isOpen: true });

    fireEvent.click(screen.getByRole('button', { name: 'Girar para a esquerda' }));

    expect(screen.getByTestId('cropper')).toHaveAttribute('data-rotation', '270');
  });

  it('cancels when the dialog is dismissed from the outside', () => {
    const actions = renderDialog({ isOpen: true });

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(actions.onCancel).toHaveBeenCalled();
  });

  // triste
  /* Antes de a imagem ser medida não existe área escolhida — confirmar mandaria um corte vazio. */
  it('does not confirm before the image has been measured', () => {
    const actions = renderDialog({ isOpen: true });

    const confirm = screen.getByRole('button', { name: /Usar esta foto/ });
    fireEvent.click(confirm);

    expect(confirm).toBeDisabled();
    expect(actions.onConfirm).not.toHaveBeenCalled();
  });

  /* Fechar no meio do envio deixaria a pessoa sem saber se a foto trocou. */
  it('cannot be dismissed while the photo is being sent', () => {
    const actions = renderDialog({ isOpen: true, isSaving: true });

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(actions.onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Girar para a direita' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();
  });

  it('keeps the upload failure inside the editor', () => {
    renderDialog({ isOpen: true, error: 'Não consegui salvar a foto agora.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não consegui salvar a foto agora.');
  });

  it('renders nothing when closed', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders nothing without a picture even when asked to open', () => {
    render(
      <AzuosAvatarCropperDialog
        data={{ imageUrl: null }}
        state={{ isOpen: true }}
        actions={{ onConfirm: vi.fn(), onCancel: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('normalizeRotation', () => {
  // feliz
  it('keeps the rotation between 0 and 359', () => {
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });

  // triste
  it('leaves a value already in range alone', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(359)).toBe(359);
  });
});
