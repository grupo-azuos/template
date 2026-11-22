import { historyDrillQuerySchema } from '@template/shared/schemas/board-drill.schema';
import { historyPageSchema } from '@template/shared/schemas/history.schema';

import { createZodDto } from '../../../lib/http/zod-dto';

/** Os DTOs nascem dos MESMOS schemas Zod que a web importa — ver `task.dto.ts`. */
/** A lista do histórico, com o recorte de um clique no painel (`drill`). */
export class HistoryQueryDto extends createZodDto(historyDrillQuerySchema) {}
export class HistoryPageDto extends createZodDto(historyPageSchema) {}
