// Run with: node --experimental-strip-types src/testSuite.test.ts
//
// A test nobody runs is worse than no test: it reads as coverage and
// enforces nothing.
//
// This repo lists its suites by hand in package.json, so adding a
// *.test.ts file does not make it run. That is not hypothetical -- the
// Telegram handle went two renames stale in five live page footers while
// src/data/contact.test.ts, the suite written specifically to catch
// exactly that, sat unlisted and therefore never ran once.
//
// So the list checks itself.

import assert from "node:assert/strict";
import process from "node:process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL  ${name}`);
    console.log(`      ${(error as Error).message.split("\n")[0]}`);
  }
}

const ROOT = new URL("..", import.meta.url).pathname;
const SEARCH_ROOTS = ["src", "supabase"];

function suites(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) suites(full, out);
    else if (full.endsWith(".test.ts")) out.push(relative(ROOT, full));
  }
  return out;
}

const found = SEARCH_ROOTS.flatMap((root) => suites(join(ROOT, root)));
const testScript: string = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts.test;

test("the walk finds the suites", () => {
  assert.ok(found.length > 5, `only ${found.length} suites found — the walk is broken`);
  assert.ok(found.includes("src/testSuite.test.ts"), "the walk did not find this file");
});

test("every suite in the repo is listed in npm test", () => {
  const unlisted = found.filter((suite) => !testScript.includes(suite));
  assert.deepEqual(
    unlisted,
    [],
    `not in package.json's test script, so never run: ${unlisted.join(", ")}`,
  );
});

test("npm test does not list a suite that no longer exists", () => {
  const listed = [...testScript.matchAll(/(\S+\.test\.ts)/g)].map((match) => match[1]);
  const vanished = listed.filter((suite) => !found.includes(suite));
  assert.deepEqual(vanished, [], `listed but missing: ${vanished.join(", ")}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
