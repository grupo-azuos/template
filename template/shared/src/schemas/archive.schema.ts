import { z } from 'zod';

/**
 * ARQUIVAR, NUNCA APAGAR — o que a casa decidiu para tudo o que este sistema guarda.
 *
 * Comentário, anexo, protocolo do bombeiro, tag e documento de contrato não se apagam: o botão
 * de remover os arquiva. Arquivado, o registro some da tela (o filtro `archived` o traz de
 * volta), o arquivo continua no bucket, e quem arquivou e quando ficam guardados.
 */
export const archiveSchema = z
  .object({
    archivedAt: z.iso.datetime({ offset: true }),
    archivedBy: z.guid().nullable(),
  })
  .nullable();

export type Archive = z.infer<typeof archiveSchema>;

export const ARCHIVED_FILTERS = ['hide', 'show', 'only'] as const;

/** `hide` (o padrão) esconde os arquivados, `show` os traz junto, `only` traz só eles. */
export const archivedFilterSchema = z.enum(ARCHIVED_FILTERS).default('hide');

export type ArchivedFilter = z.infer<typeof archivedFilterSchema>;
