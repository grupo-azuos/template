import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosAvatarCropperDialog,
  normalizeRotation,
} from './azuos-avatar-cropper-dialog.component';

const IMAGE = 'blob:http://localhost/foto';

function renderDialog(state: { isOpen?: boolean; isSaving?: boolean; error?: string | null }) {
  const actions = { onConfirm: vi.fn(), onCancel: vi.fn() };

  render(<AzuosAvatarCropperDialog data={{ imageUrl: IMAGE }} state={state} actions={actions} />);

  return actions;
}

describe('AzuosAvatarCropperDialog', () => {
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

  /* Antes de a imagem ser medida não existe área escolhida — confirmar mandaria um corte vazio. */
  it('does not confirm before the image has been measured', () => {
    const actions = renderDialog({ isOpen: true });

    const confirm = screen.getByRole('button', { name: /Usar esta foto/ });
    fireEvent.click(confirm);

    expect(confirm).toBeDisabled();
    expect(actions.onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the upload failure inside the editor', () => {
    renderDialog({ isOpen: true, error: 'Não consegui salvar a foto agora.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não consegui salvar a foto agora.');
  });

  it('renders nothing when closed', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('normalizeRotation', () => {
  it('keeps the rotation between 0 and 359', () => {
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });
});
