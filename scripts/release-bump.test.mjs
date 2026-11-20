import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bumpVersion,
  compareVersions,
  currentVersion,
  parseTag,
  setKomodoVersion,
} from "./release-bump.mjs";

const KOMODO = `[[build]]
name = "homo_app"
[build.config]
builder = "homo"
image_tag = "homo"

[[stack]]
name = "homo_app"
[stack.config]
version = "não é de build"

[[build]]
name = "prod_app"
[build.config]
version = "0.0.1"
auto_increment_version = true
builder = "prod"
`;

function repository() {
  const root = mkdtempSync(join(tmpdir(), "release-bump-test-"));
  const write = (file, content) => {
    mkdirSync(join(root, file, ".."), { recursive: true });
    writeFileSync(join(root, file), content);
  };
  write("app/package.json", '{\n  "name": "app",\n  "version": "0.1.0"\n}\n');
  write(
    "app/server/package.json",
    '{\n  "name": "server",\n  "version": "1.0.0"\n}\n',
  );
  write(
    "app/package-lock.json",
    JSON.stringify(
      {
        name: "app",
        version: "0.1.0",
        packages: {
          "": { version: "0.1.0" },
          server: { version: "1.0.0" },
          "node_modules/zod": { version: "4.6.7" },
        },
      },
      null,
      2,
    ) + "\n",
  );
  write(".komodo/komodo.toml", KOMODO);
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });

  return root;
}

// feliz
test("reads vX.Y.Z and the old prod/vX.Y.Z", () => {
  assert.equal(parseTag("v1.2.3"), "1.2.3");
  assert.equal(parseTag("prod/v10.0.12"), "10.0.12");
});

// triste
test("refuses a tag with suffix, leading zero or another prefix", () => {
  for (const tag of [
    "v1.2",
    "v1.2.3-rc1",
    "v01.2.3",
    "dashboard/v1.2.3",
    "1.2.3",
    undefined,
  ]) {
    assert.throws(() => parseTag(tag));
  }
});

// feliz
test("compares versions number by number", () => {
  assert.equal(compareVersions("1.10.0", "1.9.9"), 1);
  assert.equal(compareVersions("1.2.3", "1.2.3"), 0);
  assert.equal(compareVersions("0.9.0", "1.0.0"), -1);
});

// feliz
test("puts the version in every Komodo build and turns the auto increment off", () => {
  const toml = setKomodoVersion(KOMODO, "1.2.3");

  assert.equal(toml.match(/^version = "1\.2\.3"$/gm)?.length, 2);
  assert.equal(toml.match(/^auto_increment_version = false$/gm)?.length, 2);
  assert.doesNotMatch(
    toml,
    /auto_increment_version = true|version = "0\.0\.1"/,
  );
  assert.match(toml, /version = "não é de build"/);
  assert.equal(setKomodoVersion(toml, "1.2.3"), toml);
});

// feliz
test("writes the version in every package.json, in the lock and in Komodo", () => {
  const root = repository();

  const changed = bumpVersion(root, "2.0.0");

  assert.deepEqual(changed.sort(), [
    ".komodo/komodo.toml",
    "app/package-lock.json",
    "app/package.json",
    "app/server/package.json",
  ]);
  const lock = JSON.parse(
    readFileSync(join(root, "app/package-lock.json"), "utf8"),
  );
  assert.equal(lock.version, "2.0.0");
  assert.equal(lock.packages[""].version, "2.0.0");
  assert.equal(lock.packages.server.version, "2.0.0");
  assert.equal(lock.packages["node_modules/zod"].version, "4.6.7");
  assert.equal(currentVersion(root), "2.0.0");
});

// triste
test("changes nothing when the branch is already on the version", () => {
  const root = repository();
  bumpVersion(root, "2.0.0");
  execFileSync("git", ["add", "."], { cwd: root });

  assert.deepEqual(bumpVersion(root, "2.0.0"), []);
});
