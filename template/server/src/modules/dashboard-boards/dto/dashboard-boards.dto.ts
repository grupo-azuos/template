import { archivedFilterSchema } from '@template/shared/schemas/archive.schema';
import {
  boardResourceSchema,
  dashboardScopeSchema,
  saveBoardSchema,
  savedFilterListSchema,
  savedFilterResourceSchema,
  saveFilterSchema,
  widgetDataResourceSchema,
  widgetQuerySchema,
} from '@template/shared/schemas/dashboard-board.schema';
import { z } from 'zod';

import { createZodDto } from '../../../lib/http/zod-dto';

export class BoardScopeParamsDto extends createZodDto(z.object({ scope: dashboardScopeSchema })) {}
export class SaveBoardDto extends createZodDto(saveBoardSchema) {}
export class BoardResourceDto extends createZodDto(boardResourceSchema) {}
export class WidgetQueryDto extends createZodDto(widgetQuerySchema) {}
export class WidgetDataResourceDto extends createZodDto(widgetDataResourceSchema) {}
export class SaveFilterDto extends createZodDto(saveFilterSchema) {}
export class SavedFilterListDto extends createZodDto(savedFilterListSchema) {}
export class SavedFilterResourceDto extends createZodDto(savedFilterResourceSchema) {}
export class SavedFilterQueryDto extends createZodDto(
  z.object({ archived: archivedFilterSchema }),
) {}
