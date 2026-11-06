import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { violations } from './production-contract.mjs';

const repository = join(dirname(fileURLToPath(import.meta.url)), '..');
const KOMODO_TOML = readFileSync(join(repository, '.komodo/komodo.toml'), 'utf8');
const DOCKERFILE = readFileSync(join(repository, 'template/docker/dockerfile'), 'utf8');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'azuos-production-rule-'));
  const write = (path, content) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  write('production.json', JSON.stringify({ stage: 'mvp', database: 'sqlite', production_deploy_enabled: false }));
  write('template/server/src/lib/http/api-version.ts', 'VersioningType.URI; API-Version');
  write('template/server/src/main.ts', 'packageVersion(); setupOpenApiDocs(app, document);');
  write('template/server/src/lib/http/openapi-document.ts', 'PUBLISHED_MAJORS; docs/v${major}-json; filter: true');
  write('template/docker/caddy/caddyfile', ':8080 {\n respond 200\n}\n');
  write('template/docker/compose.yml', 'healthcheck:\nresources:\nlimits:\nmemory:\ncpus:\nstop_grace_period:\nazuos-edge\n./caddy/caddyfile\n- VALKEY_KEY_PREFIX=${APP_NAME:?}:${DEPLOY_ENV:?}\n');
  write('.komodo/komodo.toml', KOMODO_TOML);
  write('template/docker/dockerfile', DOCKERFILE);
  write('template/server/package.json', JSON.stringify({ dependencies: {}, scripts: { build: 'rspack build -c rspack.config.ts' } }));
  write('template/client/package.json', JSON.stringify({ scripts: { build: 'tsc --noEmit && rsbuild build' } }));
  write('template/docker/komodo.sh', 'infisical run --expand=false; docker stack config --skip-interpolation\nSTACK_NAME="${DEPLOY_ENV}_${APP_NAME}"\n');
  return { root, write, dispose: () => rmSync(root, { recursive: true }) };
}

test('accepts the versioned API and canonical lowercase caddy location', () => {
  const project = fixture();
  try { assert.deepEqual(violations(project.root), []); } finally { project.dispose(); }
});

test('rejects a caddy filename containing uppercase letters', () => {
  const project = fixture();
  try {
    renameSync(join(project.root, 'template/docker/caddy/caddyfile'), join(project.root, 'template/docker/caddy', 'caddyfile'.replace('c', 'C')));
    assert.ok(violations(project.root).some((error) => error.includes('entirely lowercase')));
  } finally { project.dispose(); }
});

test('rejects caddy config placed directly inside docker instead of docker/caddy', () => {
  const project = fixture();
  try {
    renameSync(join(project.root, 'template/docker/caddy/caddyfile'), join(project.root, 'template/docker/caddyfile'));
    assert.ok(violations(project.root).some((error) => error.includes('template/docker/caddy/caddyfile')));
  } finally { project.dispose(); }
});

test('rejects an API without URI versioning and version headers', () => {
  const project = fixture();
  try {
    project.write('template/server/src/lib/http/api-version.ts', 'unversioned');
    assert.ok(violations(project.root).some((error) => error.includes('URI versioning')));
  } finally { project.dispose(); }
});

test('rejects an extra caddy config outside the caddy directory', () => {
  const project = fixture();
  try {
    project.write('template/docker/extra.caddyfile', ':8080 {}');
    assert.ok(violations(project.root).some((error) => error.includes('All Caddy configs belong')));
  } finally { project.dispose(); }
});

test('rejects the postgres.js package, even in the MVP', () => {
  const project = fixture();
  try {
    project.write('template/server/package.json', JSON.stringify({ dependencies: { postgres: '^3.4.9' } }));
    assert.ok(violations(project.root).some((error) => error.includes('always pg')));
  } finally { project.dispose(); }
});

test('rejects importing postgres.js or the postgres-js Drizzle driver', () => {
  const project = fixture();
  try {
    project.write('template/server/src/lib/db/db.module.ts', "import { drizzle } from 'drizzle-orm/postgres-js';");
    assert.ok(violations(project.root).some((error) => error.includes('never postgres.js')));
  } finally { project.dispose(); }
});

test('rejects Komodo resources outside the <ambiente>_<app> name', () => {
  const project = fixture();
  try {
    project.write('.komodo/komodo.toml', KOMODO_TOML.replaceAll('homo_template', 'template-homo'));
    assert.ok(violations(project.root).some((error) => error.includes('name must be <ambiente>_<app>')));
    assert.ok(violations(project.root).some((error) => error.includes('missing repo homo_template')));
  } finally { project.dispose(); }
});

test('rejects a Komodo resource without description or with the wrong tags', () => {
  const project = fixture();
  try {
    project.write('.komodo/komodo.toml', KOMODO_TOML.replace('description = "Clone da develop do template no homo"\n', '').replace('"env:homo", "server:homo"]\n[repo.config]', '"env:homo", "server:core"]\n[repo.config]'));
    assert.ok(violations(project.root).some((error) => error.includes('repo homo_template: describe')));
    assert.ok(violations(project.root).some((error) => error.includes('repo homo_template: tags must be')));
  } finally { project.dispose(); }
});

test('rejects a webhook outside the Procedure and a Build that does not read the Repo', () => {
  const project = fixture();
  try {
    project.write('.komodo/komodo.toml', KOMODO_TOML.replace('builder = "homo"\nlinked_repo = "homo_template"\nwebhook_enabled = false', 'builder = "homo"\nwebhook_enabled = true'));
    assert.ok(violations(project.root).some((error) => error.includes('build homo_template: only the Procedure')));
    assert.ok(violations(project.root).some((error) => error.includes('build homo_template: read the files from the Repo')));
  } finally { project.dispose(); }
});

test('rejects a Valkey namespace typed by hand', () => {
  const project = fixture();
  try {
    project.write('template/docker/compose.yml', 'healthcheck:\nresources:\nlimits:\nmemory:\ncpus:\nstop_grace_period:\nazuos-edge\n./caddy/caddyfile\n- VALKEY_KEY_PREFIX\n');
    assert.ok(violations(project.root).some((error) => error.includes('<app>:<ambiente>')));
  } finally { project.dispose(); }
});

test('rejects a runtime image that copies node_modules', () => {
  const project = fixture();
  try {
    project.write('template/docker/dockerfile', `${DOCKERFILE}COPY --from=deps /repo/node_modules node_modules\n`);
    assert.ok(violations(project.root).some((error) => error.includes('not node_modules')));
  } finally { project.dispose(); }
});

test('rejects a server or client build outside Rspack', () => {
  const project = fixture();
  try {
    project.write('template/server/package.json', JSON.stringify({ dependencies: {}, scripts: { build: 'nest build' } }));
    project.write('template/client/package.json', JSON.stringify({ scripts: { build: 'vite build' } }));
    assert.ok(violations(project.root).some((error) => error.includes('(rspack build)')));
    assert.ok(violations(project.root).some((error) => error.includes('(rsbuild build)')));
  } finally { project.dispose(); }
});
