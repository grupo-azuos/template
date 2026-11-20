import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  type NotificationSetting,
  type NotificationSeverity,
  type NotificationTopic,
} from '@template/shared/schemas/notification.schema';
import { canManageNotifications } from '@template/shared/schemas/user.schema';

import { readError } from '../api/http-client';
import { notificationsApi } from '../api/notifications.api';
import { mockAuth } from '../auth/mock-user';

/**
 * "O QUE NOTIFICAR" — a aba do administrador no perfil. Cada assunto, ligado ou não, com o
 * nível. A escolha vale para a equipe inteira, por isso só ele mexe (o servidor recusa os outros
 * de qualquer jeito). Zero JSX.
 *
 * As mudanças ficam num rascunho até o Salvar: ligar e desligar dez assuntos não pode virar dez
 * gravações, nem deixar meio caminho gravado se a pessoa desistir.
 */
export type NotificationSettingsModel = {
  data: { settings: NotificationSetting[] };
  state: {
    canManage: boolean;
    isLoading: boolean;
    isSaving: boolean;
    isDirty: boolean;
    error: string | null;
    savedAt: number | null;
  };
  actions: {
    onToggle: (topic: NotificationTopic, isEnabled: boolean) => void;
    onSeverityChange: (topic: NotificationTopic, severity: NotificationSeverity) => void;
    onSave: () => void;
    onDiscard: () => void;
  };
};

export function useNotificationSettingsModel(): NotificationSettingsModel {
  const queryClient = useQueryClient();
  const canManage = canManageNotifications(mockAuth.getUser().role);
  const [draft, setDraft] = useState<Map<NotificationTopic, NotificationSetting>>(new Map());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const saved = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: notificationsApi.settings,
    enabled: canManage,
  });
  const save = useMutation({
    mutationFn: () => notificationsApi.saveSettings({ settings: [...draft.values()] }),
    onSuccess: (response) => {
      queryClient.setQueryData(['notifications', 'settings'], response);
      setDraft(new Map());
      setSavedAt(Date.now());
    },
  });

  const settings = (saved.data?.items ?? []).map((item) => draft.get(item.topic) ?? item);
  const patch = (topic: NotificationTopic, change: Partial<NotificationSetting>) => {
    const current = settings.find((item) => item.topic === topic);
    if (!current) return;
    setDraft((map) => new Map(map).set(topic, { ...current, ...change }));
    setSavedAt(null);
  };

  return {
    data: { settings },
    state: {
      canManage,
      isLoading: saved.isLoading,
      isSaving: save.isPending,
      isDirty: draft.size > 0,
      error: readError(saved.error) ?? readError(save.error),
      savedAt,
    },
    actions: {
      onToggle: (topic, isEnabled) => patch(topic, { isEnabled }),
      onSeverityChange: (topic, severity) => patch(topic, { severity }),
      onSave: () => save.mutate(),
      onDiscard: () => setDraft(new Map()),
    },
  };
}
