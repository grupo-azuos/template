import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';

import { zodSchemaOf } from './zod-dto';

/**
 * Valida `@Body()`, `@Query()` e `@Param()` cujo tipo é um DTO de `createZodDto`; o resto passa
 * direto. O valor que segue para o controller é o do schema (com `trim`, `default` e coerção).
 *
 * A recusa mantém o formato de sempre — 400 com os problemas em `errors` —, que o
 * `HttpExceptionFilter` traduz para a mensagem em português com o detalhe de cada campo.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema = zodSchemaOf(metadata.metatype);
    if (!schema) return value;

    const result = schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }
}
