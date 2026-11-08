import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosNotificationSettingsView,
  type AzuosNotificationSettingsViewProps,
} from './azuos-notification-settings-view.component';

function props(
  overrides: Partial<AzuosNotificationSettingsViewProps['state']> = {},
  isEnabled = true,
): AzuosNotificationSettingsViewProps {
  return {
    data: { settings: [{ topic: 'system.release', isEnabled, severity: 'info' }] },
    state: {
      canManage: true,
      isLoading: false,
      isSaving: false,
      isDirty: true,
      error: null,
      savedAt: null,
      ...overrides,
    },
    actions: { onToggle: vi.fn(), onSeverityChange: vi.fn(), onSave: vi.fn(), onDiscard: vi.fn() },
  };
}

describe('AzuosNotificationSettingsView', () => {
  // feliz
  it('liga e desliga assunto e salva', async () => {
    const view = props();
    render(<AzuosNotificationSettingsView {...view} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Versão nova do sistema/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(view.actions.onToggle).toHaveBeenCalledWith('system.release', false);
    expect(view.actions.onSave).toHaveBeenCalled();
  });

  // feliz
  it('diz que salvou, e mostra a recusa do servidor', () => {
    render(<AzuosNotificationSettingsView {...props({ savedAt: 1, error: 'Recusado.' })} />);

    expect(screen.getByRole('status')).toHaveTextContent('Salvo.');
    expect(screen.getByRole('alert')).toHaveTextContent('Recusado.');
  });

  // triste
  it('assunto desligado não deixa escolher nível, e sem mudança não salva', () => {
    render(<AzuosNotificationSettingsView {...props({ isDirty: false }, false)} />);

    expect(
      screen.getByRole('combobox', { name: /Nível de Versão nova do sistema/ }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  // triste
  it('quem não é administrador não vê nada', () => {
    const { container } = render(
      <AzuosNotificationSettingsView {...props({ canManage: false })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
