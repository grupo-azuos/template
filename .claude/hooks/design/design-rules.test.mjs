import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  APPS,
  LIB_FOLDERS,
  PREFIX,
  RULES,
  compareWithBaseline,
  componentFolders,
  countByKey,
  expectedExportName,
  featureOwners,
  violationKey,
  violationsTouching,
} from './design-rules.mjs';

/**
 * Cada regra é uma função pura sobre uma lista de arquivos, então o teste monta um PROJETO DE MENTIRA
 * e prova que a regra pega o que deve — e, o que importa mais, que ela NÃO pega o que é certo.
 *
 * Roda com `node --test .claude/hooks/design` (é o que o `npm run check:design:test` faz): sem
 * framework, porque o módulo testado também não tem dependência nenhuma.
 */

const SRC = APPS[0].src;

/** @param {Record<string, string>} tree */
function project(tree) {
  return Object.entries(tree).map(([path, content]) => ({ path, content }));
}

/** @param {string} id @param {ReturnType<typeof project>} files */
function run(id, files) {
  const rule = RULES.find((entry) => entry.id === id);
  assert.ok(rule, `regra inexistente: ${id}`);

  return rule.check(files);
}

/** Um componente completo e correto: pasta com prefixo, componente, story e teste. */
function component(folder, name, extra = {}) {
  const base = `${folder}/${PREFIX}${name}`;

  return {
    [`${base}/${PREFIX}${name}.component.tsx`]:
      `export function ${expectedExportName(PREFIX + name)}() { return null; }`,
    [`${base}/${PREFIX}${name}.component.stories.tsx`]: 'export default {};',
    [`${base}/${PREFIX}${name}.component.test.tsx`]: 'it("x", () => {});',
    ...extra,
  };
}

// ---------------------------------------------------------------- component-prefix

test('component-prefix: aceita a pasta com prefixo', () => {
  // feliz
  const files = project(component(`${SRC}/lib/components`, 'text-field'));

  assert.deepEqual(run('component-prefix', files), []);
});

test('component-prefix: reprova a pasta sem prefixo', () => {
  // triste
  const files = project({
    [`${SRC}/lib/components/text-field/text-field.component.tsx`]: 'export function TextField() {}',
  });

  const found = run('component-prefix', files);

  assert.equal(found.length, 1);
  assert.equal(found[0].file, `${SRC}/lib/components/text-field`);
});

test('component-prefix: não olha a pasta do CLI', () => {
  // triste (o `ui/` é do shadcn e não se renomeia)
  const files = project({ [`${SRC}/lib/components/ui/button.tsx`]: 'export function Button() {}' });

  assert.deepEqual(run('component-prefix', files), []);
});

// ---------------------------------------------------------- component-export-prefix

test('component-export-prefix: aceita a função com o prefixo no nome', () => {
  // feliz
  const files = project(component(`${SRC}/lib/components`, 'stat-card'));

  assert.deepEqual(run('component-export-prefix', files), []);
});

test('component-export-prefix: reprova a função sem o prefixo', () => {
  // triste
  const files = project({
    [`${SRC}/lib/components/${PREFIX}stat-card/${PREFIX}stat-card.component.tsx`]:
      'export function StatCard() { return null; }',
  });

  const found = run('component-export-prefix', files);

  assert.equal(found.length, 1);
  assert.match(found[0].detail, /AzuosStatCard/);
});

test('expectedExportName: converte o nome da pasta no nome da função', () => {
  // feliz
  assert.equal(expectedExportName('azuos-text-field'), 'AzuosTextField');
  assert.equal(expectedExportName('azuos-app-shell-nav-entry'), 'AzuosAppShellNavEntry');
});

// ---------------------------------------------------------------- component-siblings

test('component-siblings: aceita o componente com story e teste', () => {
  // feliz
  const files = project(component(`${SRC}/lib/components`, 'empty-state'));

  assert.deepEqual(run('component-siblings', files), []);
});

test('component-siblings: reprova o componente sem story e sem teste', () => {
  // triste
  const files = project({
    [`${SRC}/lib/components/${PREFIX}empty-state/${PREFIX}empty-state.component.tsx`]: 'x',
  });

  const details = run('component-siblings', files).map((violation) => violation.detail);

  assert.deepEqual(details.sort(), ['sem .component.stories.tsx', 'sem .component.test.tsx']);
});

test('component-siblings: a porta de entrada do ui/ não precisa de story nem teste', () => {
  // feliz — um `.ts` que só reexporta não decide nada
  const files = project({
    [`${SRC}/lib/components/${PREFIX}dialog/${PREFIX}dialog.ts`]: "export { Dialog } from '../ui/dialog';",
  });

  assert.deepEqual(run('component-siblings', files), []);
});

// -------------------------------------------------------- feature-component-in-lib

test('feature-component-in-lib: reprova o componente que leva o nome da feature', () => {
  // triste — `task-row` carrega `task` no nome E só é usado por `routes/tasks`
  const files = project({
    ...component(`${SRC}/lib/components`, 'task-row'),
    [`${SRC}/routes/tasks/index.tsx`]:
      `import { AzuosTaskRow } from '../../lib/components/${PREFIX}task-row/${PREFIX}task-row.component';`,
  });

  const found = run('feature-component-in-lib', files);

  assert.equal(found.length, 1);
  assert.equal(found[0].detail, 'só usado por routes/tasks');
});

test('feature-component-in-lib: aceita o componente usado por duas features', () => {
  // feliz
  const importLine = `import x from '../../lib/components/${PREFIX}task-row/${PREFIX}task-row.component';`;
  const files = project({
    ...component(`${SRC}/lib/components`, 'task-row'),
    [`${SRC}/routes/tasks/index.tsx`]: importLine,
    [`${SRC}/routes/reports/index.tsx`]: importLine,
  });

  assert.deepEqual(run('feature-component-in-lib', files), []);
});

test('feature-component-in-lib: o primitivo sem nome de feature fica em lib, mesmo com um consumidor só', () => {
  /* feliz — pela CONTAGEM ele seria empurrado para dentro de `tasks`, e a segunda tela que precisasse
     de um gráfico o traria de volta. Quem decide é o NOME: `donut-chart` não fala de tarefa nenhuma. */
  const files = project({
    ...component(`${SRC}/lib/components`, 'donut-chart'),
    [`${SRC}/routes/tasks/index.tsx`]:
      `import x from '../../lib/components/${PREFIX}donut-chart/${PREFIX}donut-chart.component';`,
  });

  assert.deepEqual(run('feature-component-in-lib', files), []);
});

test('featureOwners: segue a cadeia de imports até a rota', () => {
  // feliz
  const files = project({
    ...component(`${SRC}/lib/components`, 'task-row'),
    ...component(`${SRC}/lib/components`, 'task-list'),
    [`${SRC}/lib/components/${PREFIX}task-list/${PREFIX}task-list.component.tsx`]:
      `import x from '../${PREFIX}task-row/${PREFIX}task-row.component'; export function AzuosTaskList() { return null; }`,
    [`${SRC}/routes/tasks/index.tsx`]:
      `import x from '../../lib/components/${PREFIX}task-list/${PREFIX}task-list.component';`,
  });

  const owners = featureOwners(files);

  assert.deepEqual([...(owners.get(`${SRC}/lib/components/${PREFIX}task-row`) ?? [])], ['tasks']);
});

// ---------------------------------------------------------------- hook-location

test('hook-location: aceita a pasta use-<nome>', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/hooks/use-media-query/use-media-query.ts`]: 'export function useMediaQuery() {}',
  });

  assert.deepEqual(run('hook-location', files), []);
});

test('hook-location: reprova o arquivo solto e a pasta sem use-', () => {
  // triste
  const files = project({
    [`${SRC}/lib/hooks/media-query.ts`]: 'x',
    [`${SRC}/lib/hooks/helpers/thing.ts`]: 'x',
  });

  const details = run('hook-location', files).map((violation) => violation.detail);

  assert.deepEqual(details.sort(), ['arquivo solto em lib/hooks', 'pasta sem prefixo use-']);
});

test('hook-location: a pasta do CLI é exceção', () => {
  // feliz — `hooks/ui` é escrito pelo `shadcn add` e não se renomeia
  const files = project({ [`${SRC}/lib/hooks/ui/use-mobile.ts`]: 'x' });

  assert.deepEqual(run('hook-location', files), []);
});

// ---------------------------------------------------------------- view-model-name

test('view-model-name: aceita use-<nome>.model.ts e um util ao lado', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/view-models/use-task-list.model.ts`]: 'x',
    [`${SRC}/lib/view-models/form-projection.util.ts`]: 'x',
  });

  assert.deepEqual(run('view-model-name', files), []);
});

test('view-model-name: reprova o arquivo fora do padrão', () => {
  // triste
  const files = project({ [`${SRC}/lib/view-models/taskList.ts`]: 'x' });

  assert.equal(run('view-model-name', files).length, 1);
});

// ---------------------------------------------------------------- lib-folder

test('lib-folder: aceita as pastas do mapa', () => {
  // feliz
  const files = project(
    Object.fromEntries(LIB_FOLDERS.map((folder) => [`${SRC}/lib/${folder}/x.ts`, 'x'])),
  );

  assert.deepEqual(run('lib-folder', files), []);
});

test('lib-folder: reprova a pasta fora do mapa', () => {
  // triste
  const files = project({ [`${SRC}/lib/context/thing.ts`]: 'x' });

  const found = run('lib-folder', files);

  assert.equal(found.length, 1);
  assert.equal(found[0].file, `${SRC}/lib/context`);
});

// ---------------------------------------------------------------- ui-import-boundary

test('ui-import-boundary: o componente de lib pode importar o ui', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/components/${PREFIX}action-button/${PREFIX}action-button.component.tsx`]:
      "import { Button } from '../ui/button';",
  });

  assert.deepEqual(run('ui-import-boundary', files), []);
});

test('ui-import-boundary: a rota não importa o ui', () => {
  // triste
  const files = project({
    [`${SRC}/routes/tasks/index.tsx`]: "import { Button } from '../../lib/components/ui/button';",
  });

  assert.equal(run('ui-import-boundary', files).length, 1);
});

// ---------------------------------------------------------------- cross-feature-import

test('cross-feature-import: a rota pode importar componente genérico de lib', () => {
  // feliz — o caminho para `lib/components` sobe o mesmo número de pastas, e casaria sem a guarda
  const files = project({
    [`${SRC}/routes/tasks/index.tsx`]:
      `import x from '../../lib/components/${PREFIX}page-header/${PREFIX}page-header.component';`,
  });

  assert.deepEqual(run('cross-feature-import', files), []);
});

test('cross-feature-import: reprova a feature que importa componente de outra', () => {
  // triste
  const files = project({
    [`${SRC}/routes/tasks/index.tsx`]:
      `import x from '../reports/components/${PREFIX}report-row/${PREFIX}report-row.component';`,
  });

  const found = run('cross-feature-import', files);

  assert.equal(found.length, 1);
  assert.equal(found[0].detail, 'importa componente de reports');
});

// ---------------------------------------------------------------- route-markup / height

test('route-markup: a rota só compõe', () => {
  // feliz
  const files = project({
    [`${SRC}/routes/tasks/index.tsx`]: 'export default function Page() { return <AzuosTaskList />; }',
  });

  assert.deepEqual(run('route-markup', files), []);
});

test('route-markup: reprova o controle cru na rota', () => {
  // triste
  const files = project({
    [`${SRC}/routes/tasks/index.tsx`]: 'const x = <button type="button">Salvar</button>;',
  });

  const found = run('route-markup', files);

  assert.equal(found.length, 1);
  assert.equal(found[0].detail, '<button> na rota');
});

test('route-height: reprova a altura de controle escrita na rota', () => {
  // triste — quem define altura de campo é o componente, pela régua
  const files = project({ [`${SRC}/routes/tasks/index.tsx`]: 'const x = "h-9 w-full";' });

  assert.equal(run('route-height', files).length, 1);
});

test('route-height: a altura no componente não é problema da rota', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`]: 'const c = "h-9";',
  });

  assert.deepEqual(run('route-height', files), []);
});

// ---------------------------------------------------------------- classes

test('radius-by-role: aceita o raio por papel', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`]:
      'const c = "rounded-surface rounded-control rounded-box rounded-chip rounded-full";',
  });

  assert.deepEqual(run('radius-by-role', files), []);
});

test('radius-by-role: reprova o raio por tamanho', () => {
  // triste
  const files = project({
    [`${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`]: 'const c = "rounded-lg";',
  });

  assert.equal(run('radius-by-role', files).length, 1);
});

test('raw-palette: reprova a cor crua e aceita o token', () => {
  const folder = `${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`;

  // triste
  assert.equal(run('raw-palette', project({ [folder]: 'const c = "bg-emerald-100";' })).length, 1);
  // feliz
  assert.deepEqual(run('raw-palette', project({ [folder]: 'const c = "bg-success-soft";' })), []);
});

test('arbitrary-font-size: reprova o tamanho arbitrário', () => {
  const folder = `${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`;

  // triste
  assert.equal(run('arbitrary-font-size', project({ [folder]: 'const c = "text-[11px]";' })).length, 1);
  // feliz
  assert.deepEqual(run('arbitrary-font-size', project({ [folder]: 'const c = "text-xs";' })), []);
});

test('shadow-scale: aceita xs e xl, reprova o resto', () => {
  const folder = `${SRC}/lib/components/${PREFIX}x/${PREFIX}x.component.tsx`;

  // feliz
  assert.deepEqual(run('shadow-scale', project({ [folder]: 'const c = "shadow-xs shadow-xl";' })), []);
  // triste
  assert.equal(run('shadow-scale', project({ [folder]: 'const c = "shadow-lg";' })).length, 1);
});

test('shadow-scale: a gaveta de baixo do celular é a exceção', () => {
  // feliz — ela flutua sobre a tela inteira
  const path = `${SRC}/lib/components/${PREFIX}responsive-dialog-content/${PREFIX}responsive-dialog-content.component.tsx`;

  assert.deepEqual(run('shadow-scale', project({ [path]: 'const c = "shadow-2xl";' })), []);
});

// ---------------------------------------------------------------- doc-file-name

test('doc-file-name: aceita kebab-case e reprova MAIÚSCULO', () => {
  // feliz
  assert.deepEqual(run('doc-file-name', project({ 'template/docs/architecture.md': 'x' })), []);
  // triste
  assert.equal(run('doc-file-name', project({ 'template/docs/ARQUITETURA.md': 'x' })).length, 1);
});

// ---------------------------------------------------------------- baseline

test('compareWithBaseline: o que está na baseline passa; o que é novo reprova', () => {
  const known = { rule: 'raw-palette', file: 'a.tsx', detail: 'bg-red-500' };
  const fresh = { rule: 'raw-palette', file: 'b.tsx', detail: 'bg-blue-500' };

  // feliz
  const { added } = compareWithBaseline([known, fresh], countByKey([known]));

  assert.deepEqual(added, [fresh]);
});

test('compareWithBaseline: dívida paga aparece como corrigida', () => {
  // feliz — é o que manda a pessoa regravar a baseline menor
  const known = { rule: 'raw-palette', file: 'a.tsx', detail: 'bg-red-500' };

  const { added, fixed } = compareWithBaseline([], countByKey([known]));

  assert.deepEqual(added, []);
  assert.deepEqual(fixed, [violationKey(known)]);
});

test('compareWithBaseline: duas violações iguais contam duas vezes', () => {
  // triste — sem a contagem, a segunda cor crua no mesmo arquivo entraria de graça
  const one = { rule: 'raw-palette', file: 'a.tsx', detail: 'bg-red-500' };

  const { added } = compareWithBaseline([one, one], countByKey([one]));

  assert.equal(added.length, 1);
});

test('violationKey: não muda quando a linha anda', () => {
  // feliz — a chave da baseline não pode depender da linha, ou toda edição a invalidaria
  const key = violationKey({ rule: 'r', file: 'a.tsx', detail: 'd', line: 10 });

  assert.equal(key, violationKey({ rule: 'r', file: 'a.tsx', detail: 'd', line: 99 }));
});

// ---------------------------------------------------------------- violationsTouching

test('violationsTouching: pega a violação do próprio arquivo', () => {
  // feliz
  const mine = { rule: 'r', file: 'a/b.tsx', detail: 'd' };
  const other = { rule: 'r', file: 'c/d.tsx', detail: 'd' };

  assert.deepEqual(violationsTouching([mine, other], 'a/b.tsx'), [mine]);
});

test('violationsTouching: pega também a violação registrada na PASTA do componente', () => {
  /* `component-prefix` e `component-siblings` são registradas na pasta: editar o componente tem de
     acusar a violação da pasta, ou o hook ficaria calado justamente no arquivo em que a pessoa está. */
  const folder = {
    rule: 'component-siblings',
    file: 'a/azuos-x',
    detail: 'sem .component.test.tsx',
  };

  assert.deepEqual(
    violationsTouching([folder], 'a/azuos-x/azuos-x.component.tsx'),
    [folder],
  );
});

// ---------------------------------------------------------------- componentFolders

test('componentFolders: acha a pasta em lib e a de feature, e ignora o ui', () => {
  // feliz
  const files = project({
    [`${SRC}/lib/components/${PREFIX}a/${PREFIX}a.component.tsx`]: 'x',
    [`${SRC}/routes/tasks/components/${PREFIX}b/${PREFIX}b.component.tsx`]: 'x',
    [`${SRC}/lib/components/ui/button.tsx`]: 'x',
  });

  assert.deepEqual(componentFolders(files), [
    `${SRC}/lib/components/${PREFIX}a`,
    `${SRC}/routes/tasks/components/${PREFIX}b`,
  ]);
});
