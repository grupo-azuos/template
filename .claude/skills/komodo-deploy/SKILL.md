---
name: komodo-deploy
description: Gera ou corrige a configuração de deploy no Komodo de um app do Grupo Azuos — `.komodo/komodo.toml` com Build, Stack e Procedure por ambiente, e os scripts `docker/komodo.sh`, `check-env.sh`, `route.sh` e `migrate.sh`. Use ao promover um app para Homo/Prod, ao criar um app novo a partir do template ou quando o deploy no Komodo de um app divergir do template. Não concede autorização para deploy, merge ou push.
---

# Deploy no Komodo (padrão do template)

O deploy é **igual em todos os apps**. A base é este template: copie, troque só o que é do app e
não invente variações. Se um app precisa de algo diferente, mude o template primeiro.

## O que muda de um app para outro

| Valor | Exemplo | Onde |
|---|---|---|
| Nome do app, em kebab-case | `contabil` | TOML (nomes, `image_name`, `project_name`) e argumentos de `komodo.sh` |
| Pasta do app no repositório | `template` | `build_path` e `run_directory` |
| Repositório no GitHub | `grupo-azuos/contabil` | `repo` |
| Variável do projeto no Infisical | `CONTABIL_INFISICAL_PROJECT_ID` | `INFISICAL_PROJECT_ID` dos três comandos do Stack |
| Conferências do ambiente | `test "$PUBLIC_DOMAIN" = "contabil.$DEPLOY_DOMAIN"` | `docker/check-env.sh` |
| Rota no Caddy | `reverse_proxy ${STACK_NAME}_gateway:8080` | `docker/route.sh` |

Todo o resto — `docker/komodo.sh`, a estrutura do TOML, as flags — é cópia exata do template.

## `.komodo/komodo.toml`

Para cada ambiente, três recursos com o **mesmo nome** `<app>-<ambiente>`:

| Ambiente | Branch | Builder | Swarm | Token |
|---|---|---|---|---|
| `prod` | `main` | `core` | `core-prod` | `INFISICAL_PROD_TOKEN` |
| `homo` | `develop` | `homo` | `homo` | `INFISICAL_HOMO_TOKEN` |

- **Build:** `docker/dockerfile`, imagem local `azuos/<app>` sem registry. `image_tag` é o ambiente;
  só `include_commit_tag = true` (latest e versão desligados). A tag final é `<hash>-<ambiente>`,
  a mesma que `docker/komodo.sh` calcula com `git rev-parse --short HEAD`.
- **Stack:** `swarm`, `project_name = "<app>-<ambiente>"`, `run_directory` = pasta do app,
  `file_paths = ["docker/compose.yml"]`, `extra_args = ["--resolve-image", "never", "--detach=false"]`,
  `compose_cmd_wrapper_include = ["config", "deploy"]` e os três comandos (`pre_deploy`,
  `compose_cmd_wrapper`, `post_deploy`) chamando `sh docker/komodo.sh <etapa> <app> <ambiente>`.
- **Procedure:** estágio `Build` (`RunBuild`) e depois `Deploy` (`DeployStack`). Só ela tem
  `webhook_enabled = true`; Build e Stack ficam com `webhook_enabled = false`.

O webhook do GitHub aponta para `/listener/github/procedure/<app>-<ambiente>/<branch>`.

Comandos longos no TOML usam string literal (`'''`) e quebram linha com ` \` (espaço antes da
barra): o Komodo junta as linhas. Segredos e variáveis do Komodo entram como `'[[NOME]]'`.

## Scripts em `docker/`

- `komodo.sh` — cópia exata do template. Calcula `APP_IMAGE`, `STACK_NAME`, `APP_REVISION` e
  `DEPLOY_NODE_ID`, constrói `azuos-deploy-tools` e `azuos-gateway` uma vez por host e roda as
  etapas dentro de `infisical run`. A leitura `docker stack config` do Komodo roda com
  `--skip-interpolation`, para os segredos nunca ficarem gravados no Komodo.
- `check-env.sh` — só conferências (`test`, `: "${VAR:?}"`), usando `$DEPLOY_ENV`.
- `migrate.sh` — job de migration; opcional (app sem banco não tem).
- `route.sh` — grava `/etc/caddy/conf.d/${STACK_NAME}.caddy`, valida e recarrega o Caddy; opcional
  (worker/bot sem rota não tem).
- `rollback.sh` — `docker service rollback` dos serviços `<app>-<ambiente>_<serviço>`.

Nada de `deploy.sh`, `build.sh`, `on_pull` ou `[[repo]]`: o Build e o Stack do Komodo fazem esse papel.

## Regras

- Nomes de recursos, stacks e imagens em **kebab-case**. Banco continua em snake_case.
- O app nunca busca segredos: só `docker/komodo.sh` chama o Infisical.
- Sem registry, GHCR, `docker push` ou deploy no GitHub Actions.
- Formatar `.sh` com `shfmt -i 2 -ci -bn` e passar no `shellcheck -s sh`.
- Conferir com `node scripts/production-contract.mjs` antes do commit.
