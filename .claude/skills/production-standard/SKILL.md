---
name: production-standard
description: Promove um app do template de MVP para Homo/Prod no padrão do Grupo Azuos — API versionada, identidade pelo admin-console, PostgreSQL com pg, Valkey, imagem sem node_modules e deploy no Komodo. Use para publicar o MVP, preparar um app para homologação ou produção, ou alterar contratos de API. Não concede autorização para deploy, merge ou push.
---

# Padrão de produção

Regras de infraestrutura (nomes, Komodo, imagem, Valkey): `.claude/rules/infra.md`.
Deploy no Komodo: skill `komodo-deploy`. O `scripts/production-contract.mjs` confere tudo.

## 1. API

- Domínio em `/api/v1`: major na URI, versão completa do package no header `API-Version`.
- Swagger em `/docs`, com seletor de major, busca e JSON `/docs/v1-json`. Proteger também
  `/docs-json` e subcaminhos.
- Quebra de contrato é major nova, convivendo com a anterior. Adição compatível é minor;
  correção é patch. OpenAPI, consumidores, exemplos e testes de contrato mudam juntos.
- Sem versão só health e protocolos OAuth. Nunca tirar a versão de uma rota para fugir de quebra.

## 2. Identidade

- Pessoas entram pelo Caddy/auth-forward do admin-console (`/api/auth/verify`). A identidade
  enviada pelo cliente é removida antes da validação. Nada de login local, tabela de usuários ou
  administrador de reserva.
- `ADMIN_CONSOLE_URL` é a origem do emissor. `ADMIN_CONSOLE_CLIENT_SECRET` só vai a
  `/api/oauth2/token`, via Basic. APIs recebem JWT curto, nunca `um_`, `ums_` ou `uma_` como Bearer.
- Validar EdDSA/JWKS, issuer, audience, expiração e scope. Identidade de máquina não vira
  administrador humano.
- Domínio compartilhado: `SHARED_API_URL` em `/api/v1`, audience `app:shared-api`.

## 3. Banco e cache

SQLite + better-sqlite3 são só do MVP local. Para promover:

1. Schema e repositories em `pg` + `drizzle-orm/node-postgres`. **Sempre `pg`**: nunca o pacote
   `postgres` (postgres.js) nem `drizzle-orm/postgres-js`, nem em script, seed ou teste.
   Migrations PostgreSQL em diretório próprio; as SQLite já commitadas não se reescrevem.
2. `DATABASE_URL` no runtime e `DATABASE_MIGRATION_URL` (conexão direta) no job de migration,
   com entrada `src/lib/db/migrate.cli.ts`. Pool inicial 5 por réplica, com timeouts e fechamento
   no SIGTERM.
3. Export/import dos dados existentes, gerado e testado. Nunca apontar o SQLite para uma URL
   PostgreSQL.
4. Pacotes: `pg`, `@types/pg` (dev), `jose` quando houver JWT e `iovalkey` 0.4.0.
5. Nomes do banco em snake_case. O Valkey usa o namespace `<app>:<ambiente>`, montado no
   `docker/compose.yml`: não se digita no Infisical.
6. `production.json` só muda depois da promoção implementada e testada. O contrato reprova SQLite
   fora do MVP e a API recusa subir o MVP SQLite com `NODE_ENV=production`.

## 4. Imagem e runtime

- Build pelo Rspack (server) e Rsbuild (client); a imagem leva só o pacote, as migrations e o
  client, sem `node_modules`.
- Containers sem porta pública própria, com limites e reservas, healthcheck, usuário sem
  privilégio e desligamento gracioso. Backend só na rede privada do stack; só o gateway entra na
  overlay `azuos-edge`.
- Atualização start-first exige migration compatível com a versão anterior; remover coluna fica
  para uma release seguinte. Bots e schedulers são singletons stop-first.

## 5. Ambientes e segredos

- Homo = `develop` no servidor homo; Prod = `main` no core. Banco, Valkey, cookies, credenciais e
  URLs são próprios de cada ambiente.
- Segredos só no Infisical, injetados pelas etapas de `docker/komodo.sh`. Nada de CLI/SDK do
  cofre no app, no dockerfile ou no entrypoint. Não criar variável de ambiente nova para infra.
- `.env.example` com o contrato real, sem valor secreto. `VITE_`/`PUBLIC_` só com configuração
  pública.

## Antes dos commits

`node scripts/production-contract.mjs`, testes, build e validação de compose, Caddy e TOML.
Registre as limitações reais da promoção: um compose não converte o banco sozinho.
