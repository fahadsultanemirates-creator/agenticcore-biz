// Run with: node --experimental-strip-types src/lib/dashboardData.test.ts
//
// Three things have to agree about every row the dashboard reads: the
// TypeScript type, the `select` string next to it, and the column that
// actually exists in Postgres. dashboardData.ts's own header warns about
// the first two drifting -- "a column added to the type and not to the
// string" arrives undefined and renders as a blank, which is the hardest
// kind of bug to see, because nothing throws.
//
// The third is worse and is new here. project_messages and
// project_deliverables did not exist until migration 0010, so a select
// naming a column the migration never created fails at runtime on a
// paying client's dashboard and looks exactly like a network error.
//
// Read as text, not imported: dashboardData.ts pulls in lib/supabase.ts,
// which reads import.meta.env and only resolves under Vite.

import assert from "node:assert/strict";
import process from "node:process";
import { readFileSync } from "node:fs";

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

const DATA = readFileSync(new URL("./dashboardData.ts", import.meta.url), "utf8");
const MIGRATION = readFileSync(
  new URL("../../supabase/migrations/0010_project_messages_and_deliverables.sql", import.meta.url),
  "utf8",
);

/** The field names declared on an exported row type. */
function typeFields(typeName: string): string[] {
  const match = new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\};`).exec(DATA);
  assert.ok(match, `type ${typeName} not found`);
  return [...match[1].matchAll(/^\s{2}(\w+)[?]?:/gm)].map((m) => m[1]);
}

/** The columns named in a `const X_COLUMNS = "..."` select string. */
function selectColumns(constName: string): string[] {
  const match = new RegExp(`const ${constName} =\\s*((?:"[^"]*"\\s*\\+?\\s*)+);`).exec(DATA);
  assert.ok(match, `${constName} not found`);
  return [...match[1].matchAll(/"([^"]*)"/g)]
    .map((m) => m[1])
    .join("")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

/** The column names in a `create table public.<name> (...)` block. */
function tableColumns(table: string): string[] {
  const match = new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`).exec(MIGRATION);
  assert.ok(match, `create table ${table} not found in the migration`);
  return [...match[1].matchAll(/^\s{2}(\w+)\s+(?:uuid|text|timestamptz|bigint|boolean|numeric)/gm)].map(
    (m) => m[1],
  );
}

const SHAPES = [
  { type: "MessageRow", columns: "MESSAGE_COLUMNS", table: "project_messages" },
  { type: "DeliverableRow", columns: "DELIVERABLE_COLUMNS", table: "project_deliverables" },
] as const;

test("the scrapes actually read something", () => {
  for (const shape of SHAPES) {
    assert.ok(typeFields(shape.type).length >= 5, `${shape.type} scraped too few fields`);
    assert.ok(selectColumns(shape.columns).length >= 5, `${shape.columns} scraped too few columns`);
    assert.ok(tableColumns(shape.table).length >= 5, `${shape.table} scraped too few columns`);
  }
});

for (const shape of SHAPES) {
  test(`${shape.type} and ${shape.columns} name the same fields`, () => {
    assert.deepEqual(
      [...typeFields(shape.type)].sort(),
      [...selectColumns(shape.columns)].sort(),
    );
  });

  test(`every column ${shape.columns} selects exists in ${shape.table}`, () => {
    const actual = new Set(tableColumns(shape.table));
    const missing = selectColumns(shape.columns).filter((column) => !actual.has(column));
    assert.deepEqual(missing, [], `${shape.table} has no column ${missing.join(", ")}`);
  });
}

test("the deliverables bucket the client reads is the one the migration creates", () => {
  const used = [...DATA.matchAll(/\.from\("([^"]+)"\)\s*\n?\s*\.createSignedUrl/g)].map((m) => m[1]);
  assert.deepEqual(used, ["deliverables"], "signedDeliverableUrl reads an unexpected bucket");
  assert.ok(
    /insert into storage\.buckets[\s\S]*?'deliverables'/.test(MIGRATION),
    "the migration does not create the deliverables bucket",
  );
});

test("a client-posted message is always authored 'client'", () => {
  // The insert policy refuses anything else, so a different literal here
  // would not be a cosmetic bug -- every send would fail.
  const insert = /\.from\("project_messages"\)\.insert\(\{([\s\S]*?)\}\)/.exec(DATA);
  assert.ok(insert, "the project_messages insert was not found");
  assert.match(insert[1], /author:\s*"client"/);
  assert.ok(
    /create policy "insert_own_client_messages"[\s\S]*?author = 'client'/.test(MIGRATION),
    "the migration's insert policy no longer pins author to 'client'",
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
