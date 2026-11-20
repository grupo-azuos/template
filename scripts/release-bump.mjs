// A tag `vX.Y.Z` na main é a fonte da versão do app. Este script grava a versão em todo lugar que a
// guarda (package.json, package-lock.json e o Build do Komodo) e faz o commit de bump na main e na
// develop. Roda na Action `Release/Bump`, sem `npm ci`: só Node e git.
//
// Uso: node scripts/release-bump.mjs v1.2.3
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

/** `v1.2.3` (o padrão) ou `prod/v1.2.3` (o formato antigo de alguns apps). Sem sufixo. */
export function parseTag(tag) {
  const match = /^(?:prod\/)?v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
    tag ?? "",
  );
  if (!match) throw new Error(`Tag "${tag}" fora do padrão vX.Y.Z`);

  return match.slice(1).join(".");
}

export function compareVersions(left, right) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return Math.sign(a[index] - b[index]);
  }

  return 0;
}

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

/* Mantém a indentação e a quebra de linha final do arquivo, para o diff mostrar só a versão. */
function updateJson(path, change) {
  const original = readFileSync(path, "utf8");
  const data = JSON.parse(original);
  change(data);
  const indent = original.match(/\n(\s+)"/)?.[1] ?? "  ";
  writeFileSync(
    path,
    JSON.stringify(data, null, indent) + (original.endsWith("\n") ? "\n" : ""),
  );
}

/**
 * Em cada `[build.config]` do Komodo: `version` igual à tag e `auto_increment_version = false`
 * (sem isso o Komodo soma 1 no patch a cada build e a versão dele descola da tag).
 */
export function setKomodoVersion(toml, version) {
  return toml.replace(
    /^\[build\.config\]\n((?:(?!\[).*\n?)*)/gm,
    (_block, body) => {
      const rest = body
        .split("\n")
        .filter((line) => !/^(version|auto_increment_version)\s*=/.test(line))
        .join("\n");

      return `[build.config]\nversion = "${version}"\nauto_increment_version = false\n${rest}`;
    },
  );
}

/** O maior `version` entre os package.json do repositório: a versão em que a branch está. */
export function currentVersion(root) {
  return trackedFiles(root, "package.json")
    .map(
      (file) =>
        JSON.parse(readFileSync(join(root, file), "utf8")).version ?? "0.0.0",
    )
    .reduce(
      (highest, version) =>
        compareVersions(version, highest) > 0 ? version : highest,
      "0.0.0",
    );
}

function trackedFiles(root, name) {
  return git(root, "ls-files", `*${name}`, name)
    .split("\n")
    .filter((file) => file && (file === name || file.endsWith(`/${name}`)));
}

/** Grava a versão em todos os arquivos e devolve os que mudaram. */
export function bumpVersion(root, version) {
  const manifests = trackedFiles(root, "package.json");
  for (const file of manifests) {
    updateJson(join(root, file), (data) => {
      data.version = version;
    });
  }

  /* No lock, a raiz e cada workspace (pela pasta do package.json dele) levam a versão nova. */
  for (const lock of trackedFiles(root, "package-lock.json")) {
    const lockDir = dirname(lock);
    const workspaces = manifests
      .map((file) => relative(lockDir, dirname(file)).replaceAll("\\", "/"))
      .filter((dir) => dir !== "" && !dir.startsWith(".."));
    updateJson(join(root, lock), (data) => {
      data.version = version;
      if (data.packages?.[""]) data.packages[""].version = version;
      for (const dir of workspaces) {
        if (data.packages?.[dir]) data.packages[dir].version = version;
      }
    });
  }

  for (const toml of trackedFiles(root, "komodo.toml")) {
    const path = join(root, toml);
    writeFileSync(path, setKomodoVersion(readFileSync(path, "utf8"), version));
  }

  return git(root, "diff", "--name-only").split("\n").filter(Boolean);
}

/* Um checkout temporário por branch e por tentativa: sem rebase, sem push forçado. */
function bumpBranch(root, branch, version) {
  for (let attempt = 0; attempt < 3; attempt++) {
    git(root, "fetch", "origin", branch);
    const temporary = mkdtempSync(join(tmpdir(), "azuos-bump-"));
    const checkout = join(temporary, "checkout");
    git(root, "worktree", "add", "--detach", checkout, `origin/${branch}`);
    try {
      if (compareVersions(currentVersion(checkout), version) > 0) {
        console.log(
          `${branch}: já está numa versão maior que ${version}; nada a fazer`,
        );
        return;
      }
      const changed = bumpVersion(checkout, version);
      if (changed.length === 0) {
        console.log(`${branch}: já está em ${version}`);
        return;
      }
      git(checkout, "add", "--", ...changed);
      git(
        checkout,
        "commit",
        "-m",
        `[chore](docker): Versão ${version} [skip ci]`,
      );
      try {
        git(checkout, "push", "origin", `HEAD:refs/heads/${branch}`);
        console.log(
          `${branch}: versão ${version} em ${changed.length} arquivo(s)`,
        );
        return;
      } catch (error) {
        if (attempt === 2) throw error;
        console.log(`${branch}: alguém enviou antes; tentando de novo`);
      }
    } finally {
      git(root, "worktree", "remove", "--force", checkout);
      rmSync(temporary, { recursive: true, force: true });
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const version = parseTag(process.argv[2]);
  const root = git(process.cwd(), "rev-parse", "--show-toplevel");
  for (const branch of ["main", "develop"]) bumpBranch(root, branch, version);
}
