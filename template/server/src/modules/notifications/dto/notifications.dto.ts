import {
  markNotificationsReadSchema,
  notificationInboxSchema,
  notificationPageSchema,
  notificationQuerySchema,
  notificationReadResultSchema,
  notificationSchema,
  notificationSettingListSchema,
  updateNotificationSettingsSchema,
} from '@template/shared/schemas/notification.schema';

import { createZodDto } from '../../../lib/http/zod-dto';

/** Os DTOs nascem dos MESMOS schemas que a web importa: validação e Swagger não divergem. */
export class MarkNotificationsReadDto extends createZodDto(markNotificationsReadSchema) {}

export class NotificationQueryDto extends createZodDto(notificationQuerySchema) {}

export class NotificationDto extends createZodDto(notificationSchema) {}

export class NotificationPageDto extends createZodDto(notificationPageSchema) {}

export class NotificationInboxDto extends createZodDto(notificationInboxSchema) {}

export class NotificationReadResultDto extends createZodDto(notificationReadResultSchema) {}

export class NotificationSettingListDto extends createZodDto(notificationSettingListSchema) {}

export class UpdateNotificationSettingsDto extends createZodDto(updateNotificationSettingsSchema) {}
