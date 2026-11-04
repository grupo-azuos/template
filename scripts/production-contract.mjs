#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (project, path) => readFileSync(join(project, path), 'utf8');
const rule = (condition, message) => condition ? [] : [message];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : files(path);
    return [path];
  });
}

function apiRules(project) {
  const version = read(project, 'template/server/src/lib/http/api-version.ts');
  const main = read(project, 'template/server/src/main.ts');
  const docs = read(project, 'template/server/src/lib/http/openapi-document.ts');
  return [
    ...rule(version.includes('VersioningType.URI') && version.includes('API-Version'), 'Use URI versioning /api/v1 and API-Version from the package version'),
    ...rule(main.includes('packageVersion()') && main.includes('setupOpenApiDocs(app'), 'Publish versioned Swagger using the application version'),
    ...rule(docs.includes('PUBLISHED_MAJORS') && docs.includes('docs/v${major}-json') && docs.includes('filter: true'), 'Swagger needs the version selector and the search box'),
  ];
}

function containerRules(project, compose) {
  const required = ['healthcheck:', 'resources:', 'limits:', 'memory:', 'cpus:', 'stop_grace_period:', 'azuos-edge'];
  const deploy = read(project, 'template/docker/deploy.sh');
  const toml = read(project, '.komodo/komodo.toml');
  return [
    ...required.filter((token) => !compose.includes(token)).map((token) => `Container contract missing ${token}`),
    ...rule(toml.includes('infisical --silent') && toml.includes('run --expand=false') && toml.includes('--env=') && toml.includes('sh docker/deploy.sh'), 'Inject Infisical in the Komodo TOML before local native Swarm deployment'),
    ...rule(deploy.includes('docker stack deploy --detach=false --resolve-image never'), 'Deploy through native Swarm updates'),
    ...rule(!/python|ghcr\.io|docker push/.test(toml + compose + deploy), 'Do not use Python controllers, GHCR or image publishing'),
  ];
}

function caddyRules(project, compose) {
  const directory = join(project, 'template/docker/caddy');
  const paths = files(join(project, 'template')).filter((path) => /caddyfile/i.test(basename(path)));
  const names = paths.flatMap((path) => [
    ...rule(basename(path) === basename(path).toLowerCase(), 'Caddy configuration filenames must be entirely lowercase'),
    ...rule(path.startsWith(directory + '/'), 'All Caddy configs belong in template/docker/caddy/'),
  ]);
  return [
    ...rule(existsSync(join(directory, 'caddyfile')), 'Place the lowercase caddyfile in template/docker/caddy/caddyfile'),
    ...rule(compose.includes('./caddy/caddyfile') && !/\/etc\/caddy\/[^\s]*[A-Z][^\s]*/.test(compose), 'Compose must use the lowercase docker/caddy/caddyfile path'),
    ...names,
  ];
}

function sourceRules(project) {
  return files(join(project, 'template/server/src'))
    .filter((path) => path.endsWith('.ts'))
    .flatMap((path) => rule(!/infisical\s+(run|export|login)\b/.test(readFileSync(path, 'utf8')), 'Do not fetch Infisical secrets in application code'));
}

function databaseRules(project) {
  const policy = JSON.parse(read(project, 'production.json'));
  if (policy.stage === 'mvp') return [];
  const pkg = JSON.parse(read(project, 'template/server/package.json'));
  const env = read(project, 'template/server/.env.example');
  const required = ['DATABASE_URL=', 'DATABASE_POOL_SIZE=', 'DATABASE_MIGRATION_URL=', 'VALKEY_URL=', 'ADMIN_CONSOLE_CLIENT_SECRET='];
  const sqlite = files(join(project, 'template/server/src'))
    .filter((path) => path.endsWith('.ts'))
    .filter((path) => /from ['"](?:better-sqlite3|drizzle-orm\/(?:sqlite-core|better-sqlite3))['"]/.test(readFileSync(path, 'utf8')))
    .map((path) => `Replace the MVP SQLite provider before promotion: ${path}`);
  return [
    ...rule(Boolean(pkg.dependencies?.pg), 'Promotion requires pg, bounded pooling and PostgreSQL migrations'),
    ...rule(existsSync(join(project, 'template/server/src/lib/db/migrate.cli.ts')), 'Promotion requires a PostgreSQL migration entrypoint'),
    ...required.filter((name) => !env.includes(name)).map((name) => `Document ${name} for production`),
    ...sqlite,
  ];
}

export function violations(project) {
  const compose = read(project, 'template/docker/compose.yml');
  return [...new Set([...apiRules(project), ...containerRules(project, compose), ...caddyRules(project, compose), ...sourceRules(project), ...databaseRules(project)])];
}

function main() {
  const errors = violations(root);
  if (errors.length === 0) return;
  console.error(errors.join('\n'));
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
