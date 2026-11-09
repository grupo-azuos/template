import { hasRoleAtLeast, userRoleSchema } from '@template/shared/schemas/user.schema';
import { type NextFunction, type Request, type Response } from 'express';

/**
 * Cobre Swagger e todos os JSON de versão antes de registrar as rotas no Express. Em cascata:
 * do gestor para cima (dono e gestor da operação também).
 */
export function docsAccess(nodeEnv: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const role = userRoleSchema.safeParse(request.headers['x-forwarded-user-role']).data;
    if (nodeEnv !== 'production' || hasRoleAtLeast(role, 'manager')) return next();
    response.status(403).json({
      error: { status: 403, detail: 'A documentação é restrita a administradores e gestores.' },
    });
  };
}
