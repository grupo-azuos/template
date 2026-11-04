---
name: production-standard
description: Promove um app do template de MVP para Homo/Prod e mantém o padrão de API, OAuth2, banco e containers do Grupo Azuos. Use para publicar o MVP, preparar Komodo ou alterar contratos de API. Não concede autorização para deploy, merge ou push.
---

# Padrão de produção

O admin-console é a referência de autenticação e contratos. Não criar login local, tabelas de usuários ou fallback de administrador em produção.

## API

- Domínio em `/api/v1`; major na URI, versão completa do package em `API-Version`.
- Swagger em `/docs`, seletor de major, busca e JSON `/docs/v1-json`. Proteger também `/docs-json` e subcaminhos.
- Quebra de contrato exige nova major coexistindo com a anterior. Adição compatível é minor; correção é patch. Atualizar OpenAPI, consumidores, exemplos e testes de contrato juntos.
- Exceções neutras precisam de motivo externo: health e protocolos OAuth. Nunca desversionar uma rota para contornar uma quebra.

## Identidade e serviços

- Pessoas entram pelo Caddy/auth-forward do admin-console (`/api/auth/verify`); remover identidade fornecida pelo cliente antes da validação.
- `ADMIN_CONSOLE_URL` é a origem do emissor. `ADMIN_CONSOLE_CLIENT_SECRET` só vai a `/api/oauth2/token`, via Basic. APIs recebem JWT curto, não `um_`, `ums_` ou `uma_` como Bearer.
- Validar EdDSA/JWKS, issuer, audience, expiração e scope. Não transformar identidade de máquina em administrador humano.
- Chamadas de domínio compartilhado usam `SHARED_API_URL` e `/api/v1`, com audience `app:shared-api`.

## Saída do MVP

SQLite + better-sqlite3 são exclusivos do MVP local. Antes de Homo/Prod:

1. Migrar schema e repositories para `pg` + `drizzle-orm/node-postgres`; gerar migrations PostgreSQL em diretório separado, sem reescrever as SQLite já commitadas.
2. Usar `DATABASE_URL` para runtime e `DATABASE_MIGRATION_URL` direta para o job de migration. Pool inicial 5 por réplica, com timeouts e fechamento no SIGTERM. Conferir orçamento total contando blue e green de todos os apps.
3. Gerar e testar export/import dos dados existentes; não apontar SQLite para uma URL PostgreSQL.
4. Instalar `pg`, tipos `@types/pg` em desenvolvimento, `jose` quando houver validação JWT e o cliente `iovalkey` 0.4.0. Banco e Valkey são os serviços compartilhados do ambiente, sem containers locais por app.
5. Alterar `production.json` somente após implementar e testar a promoção. O hook reprova SQLite fora do MVP; a API também recusa iniciar o MVP SQLite em NODE_ENV=production.

## Infraestrutura e segredos

- Partir de `template/docker/compose.yml`, `template/docker/caddy/caddyfile`, `.komodo/komodo.toml`.
- Configurações de Caddy ficam em `docker/caddy/`, dentro de `docker/`, com nomes totalmente minúsculos. O arquivo principal é `caddyfile`; configs adicionais, como `site.caddyfile`, também são minúsculas. Compose, dockerfile e comandos usam `/etc/caddy/caddyfile` com adapter explícito.
- Usar `docker/dockerfile` e `docker/compose.yml`; cada contexto adicional tem seu próprio diretório e arquivo `dockerfile` sem sufixo. `.komodo/komodo.toml` fica na raiz do repositório, fora de `docker/` e do pacote interno. Corrigir também paths de build, workflows, scripts e documentação ao mover arquivos.
- Containers sem portas públicas próprias, com limites/reservas, readiness, usuário sem privilégios e desligamento gracioso. Backend só na rede privada da stack; somente gateway na overlay de borda.
- O Komodo executa Infisical no TOML antes de migration/deploy. Nunca adicionar CLI/SDK do cofre no app nem buscar segredos no dockerfile/entrypoint.
- Prod/main usa core; Homo/develop usa homo. PostgreSQL, Valkey, cookies, credenciais e URLs são próprios de cada ambiente. Namespace do cache: `<app>:<environment>:`.
- Atualização nativa start-first exige migration compatível com a versão anterior. Remoção de coluna fica para release posterior. Bots e schedulers são singletons stop-first.
- Atualizar todos os `.env.example` com o contrato real, sem valores secretos. `VITE_`/`PUBLIC_` só contêm configuração pública.

Execute `node scripts/production-contract.mjs`, testes, build e validação dos Compose/Caddy/TOML antes dos commits. Registre limitações reais da promoção; um Compose não converte o provider de banco sozinho.

Build e deploy são locais no Komodo. Não usar GHCR, build/deploy de produção no GitHub Actions ou controladores Python. Scripts sh pequenos chamam Docker; Swarm gerencia update e rollback.
