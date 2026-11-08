import { Save } from 'lucide-react';

import {
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_TOPICS,
  type NotificationSeverity,
} from '@template/shared/schemas/notification.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosCheckboxField } from '../../../../lib/components/azuos-checkbox-field/azuos-checkbox-field.component';
import { AzuosPanelCard } from '../../../../lib/components/azuos-panel-card/azuos-panel-card.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { cn } from '../../../../lib/utils/cn.util';
import { notificationLook } from '../../../../lib/utils/notification-style.util';
import { type NotificationSettingsModel } from '../../../../lib/view-models/use-notification-settings.model';

/**
 * "O QUE NOTIFICAR" — do administrador. Cada assunto: ligado ou não, e com que
 * nível. O nível escolhido aparece ao lado, com a cara que a equipe vai ver.
 */
export type AzuosNotificationSettingsViewProps = NotificationSettingsModel;

const SEVERITY_OPTIONS = NOTIFICATION_SEVERITIES.map((severity) => ({
  value: severity,
  label: notificationLook(severity).label,
  icon: notificationLook(severity).icon,
}));

export function AzuosNotificationSettingsView({
  data,
  state,
  actions,
}: AzuosNotificationSettingsViewProps) {
  if (!state.canManage) return null;

  return (
    <AzuosPanelCard
      data={{
        title: 'O que notificar',
        hint: 'Vale para a equipe inteira. Urgente abre no meio da tela e só fecha depois de lida.',
      }}
      ui={{ bodyClassName: 'flex flex-col gap-4' }}
    >
      {state.isLoading ? <p className="text-ink-500 text-sm">Carregando…</p> : null}
      <ul className="divide-border/60 divide-y">
        {data.settings.map((setting) => {
          const topic = NOTIFICATION_TOPICS[setting.topic];
          const look = notificationLook(setting.severity);
          const Icon = look.icon;

          return (
            <li key={setting.topic} className="flex flex-wrap items-center gap-3 py-3">
              <AzuosCheckboxField
                data={{
                  label: topic.label,
                  name: `notify-${setting.topic}`,
                  isChecked: setting.isEnabled,
                  description: topic.description,
                }}
                ui={{ className: 'min-w-64 flex-1' }}
                state={{ isDisabled: state.isSaving }}
                actions={{ onChange: (isChecked) => actions.onToggle(setting.topic, isChecked) }}
              />
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full',
                  setting.isEnabled ? look.tone.dot : 'bg-muted text-ink-500',
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <AzuosSelectField
                data={{ value: setting.severity, options: SEVERITY_OPTIONS }}
                ui={{ ariaLabel: `Nível de ${topic.label}`, className: 'w-44' }}
                state={{ isDisabled: !setting.isEnabled || state.isSaving }}
                actions={{
                  onChange: (value) =>
                    actions.onSeverityChange(setting.topic, value as NotificationSeverity),
                }}
              />
            </li>
          );
        })}
      </ul>

      {state.error ? (
        <p role="alert" className="text-hue-red text-sm font-medium">
          {state.error}
        </p>
      ) : null}
      {state.savedAt ? (
        <p role="status" className="text-hue-green text-sm font-medium">
          Salvo. A equipe passa a receber assim.
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <AzuosActionButton
          data={{ label: 'Desfazer mudanças' }}
          ui={{ variant: 'secondary' }}
          state={{ isDisabled: !state.isDirty || state.isSaving }}
          actions={{ onClick: actions.onDiscard }}
        />
        <AzuosActionButton
          data={{ label: 'Salvar', loadingLabel: 'Salvando…' }}
          ui={{ icon: Save }}
          state={{ isDisabled: !state.isDirty, isLoading: state.isSaving }}
          actions={{ onClick: actions.onSave }}
        />
      </div>
    </AzuosPanelCard>
  );
}
