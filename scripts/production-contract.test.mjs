import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { violations } from './production-contract.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'azuos-production-rule-'));
  const write = (path, content) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  write('production.json', JSON.stringify({ stage: 'mvp', database: 'sqlite', production_deploy_enabled: false }));
  write('template/server/src/lib/http/api-version.ts', 'VersioningType.URI; API-Version');
  write('template/server/src/main.ts', 'packageVersion(); docs/v1-json');
  write('template/docker/caddy/caddyfile', ':8080 {\n respond 200\n}\n');
  write('template/docker/compose.yml', 'healthcheck:\nresources:\nlimits:\nmemory:\ncpus:\nstop_grace_period:\nazuos-edge\n./caddy/caddyfile\n');
  write('.komodo/komodo.toml', 'infisical --silent run --expand=false --env=staging -- sh docker/deploy.sh');
  write('template/docker/deploy.sh', 'docker stack deploy --detach=false --resolve-image never');
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
