import {
  type Notification,
  type NotificationSeverity,
} from '@template/shared/schemas/notification.schema';

/**
 * NOTIFICAÇÕES DE EXEMPLO para histórias e testes — uma de cada nível. Tarefas e pessoas são
 * fictícias. As datas são fixas: a história não muda de cara conforme o dia em que roda.
 *
 * O template só tem o assunto "versão nova"; os textos mostram como cada nível aparece quando
 * o sistema ganhar os assuntos dele.
 */
export const NOTIFICATION_NOW = new Date('2026-11-07T15:00:00.000Z');

const BY_SEVERITY: Record<NotificationSeverity, Omit<Notification, 'id' | 'readAt'>> = {
  urgent: {
    topic: 'system.release',
    severity: 'urgent',
    title: 'Prazo de tarefa vencido',
    body: 'A tarefa "Enviar a proposta ao cliente" passou do prazo em 03/11/2026. Resolva o quanto antes.',
    action: { label: 'Abrir as tarefas', to: '/tasks' },
    createdAt: '2026-11-07T14:48:00.000Z',
  },
  important: {
    topic: 'system.release',
    severity: 'important',
    title: 'Tarefa atribuída a você',
    body: 'Bia colocou você na tarefa "Revisar o contrato de exemplo".',
    action: { label: 'Abrir as tarefas', to: '/tasks' },
    createdAt: '2026-11-07T14:15:00.000Z',
  },
  normal: {
    topic: 'system.release',
    severity: 'normal',
    title: 'Ana comentou numa tarefa sua',
    body: 'Ligar para o cliente: Combinado, retorno amanhã.',
    action: { label: 'Abrir as tarefas', to: '/tasks' },
    createdAt: '2026-11-07T11:40:00.000Z',
  },
  info: {
    topic: 'system.release',
    severity: 'info',
    title: 'Versão 2.4.0 no ar',
    body: 'O sistema foi atualizado. Se algo parecer diferente, é novidade — não erro.',
    action: null,
    createdAt: '2026-11-06T13:00:00.000Z',
  },
};

export function notificationFixture(
  severity: NotificationSeverity = 'normal',
  overrides: Partial<Notification> = {},
): Notification {
  const index = ['urgent', 'important', 'normal', 'info'].indexOf(severity) + 1;

  return {
    id: `0196f3e8-0000-7000-8000-00000000a00${index}`,
    readAt: null,
    ...BY_SEVERITY[severity],
    ...overrides,
  };
}

/** As quatro, na ordem de atenção. */
export const ALL_SEVERITY_NOTIFICATIONS: Notification[] = (
  ['urgent', 'important', 'normal', 'info'] as const
).map((severity) => notificationFixture(severity));
