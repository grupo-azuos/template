import { docsAccess } from './lib/http/docs-access.middleware';
import { setupOpenApiDocs } from './lib/http/openapi-document';
import { withZodSchemas } from './lib/http/zod-dto';
import { packageVersion } from './lib/http/api-version';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { setupApp } from './app.setup';
import { parseEnv } from './lib/config/env.schema';

async function bootstrap(): Promise<void> {
  /* O ambiente é validado ANTES de subir o servidor. Falhar na partida é barato; subir com
     valor errado faz cada requisição falhar com um erro que não aponta para o .env. */
  const env = parseEnv(process.env);

  const app = await NestFactory.create(AppModule, { logger: logLevels(env.API_LOG_LEVEL) });
  /* Fecha o banco com Ctrl+C: é o que grava o WAL de volta no arquivo principal. */
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set('trust proxy', env.TRUST_PROXY_HOPS);

  setupApp(app, env);

  /* `withZodSchemas` põe no documento o JSON Schema completo de cada DTO Zod. Sem isto o contrato
     publicado sai sem formatos e limites — e endpoint sem contrato legível reprova o CI. */
  const document = withZodSchemas(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Template')
        .setDescription(
          [
            'API do MVP.',
            '',
            'Duas convenções que valem para toda a API:',
            '',
            '- **Autoria vem da identidade, não do corpo.** Campos como `createdBy` e `updatedBy` são carimbados pelo servidor e ignorados se enviados na requisição.',
            '- **Edição é parcial.** Campo ausente fica como está; campo enviado como nulo é limpo.',
            '',
            '## Autenticação',
            '',
            'Esta API **não tem login**. A identidade chega pronta, do proxy que já autenticou a pessoa, nos cabeçalhos `x-forwarded-user-id`, `x-forwarded-user-email`, `x-forwarded-user-name` e `x-forwarded-user-role`.',
            '',
            'Uma requisição SEM nenhum desses cabeçalhos assume o usuário de demonstração (administrador). Uma requisição COM os cabeçalhos presentes e malformados é recusada com 401 — e nunca cai no usuário de demonstração.',
          ].join('\n'),
        )
        .setVersion(packageVersion())
        /* Não é `addBearerAuth`: não existe token para enviar. O que autentica é o conjunto
           de cabeçalhos que o proxy injeta, e é isso que o "Authorize" do Swagger oferece. */
        .addApiKey(
          {
            type: 'apiKey',
            in: 'header',
            name: 'x-forwarded-user-email',
            description:
              'E-mail de quem está pedindo. Em produção quem preenche é o proxy; aqui serve para experimentar a API como outra pessoa.',
          },
          'auth-forward',
        )
        .addApiKey(
          {
            type: 'apiKey',
            in: 'header',
            name: 'x-forwarded-user-role',
            description:
              'Perfil, em cascata: `user`, `manager`, `operations_manager`, `owner` ou `admin`. Decide o que a policy permite.',
          },
          'auth-forward-role',
        )
        .build(),
    ),
  );

  app.use(['/docs', '/docs-json'], docsAccess(env.NODE_ENV));
  setupOpenApiDocs(app, document, 'Template');

  await app.listen(env.API_PORT);

  const logger = new Logger('bootstrap');
  logger.log(`API em http://localhost:${env.API_PORT}/api`);
  logger.log(`Swagger em http://localhost:${env.API_PORT}/docs`);
}

function logLevels(
  level: 'debug' | 'log' | 'warn' | 'error',
): ('debug' | 'log' | 'warn' | 'error')[] {
  const order = ['debug', 'log', 'warn', 'error'] as const;

  return order.slice(order.indexOf(level));
}

void bootstrap();
