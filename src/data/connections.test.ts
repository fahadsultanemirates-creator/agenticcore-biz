// Run with: node --experimental-strip-types src/data/connections.test.ts
//
// The provider list is checked against the database's own rules rather than
// against itself. project_connections.provider shape-checks the id and
// nothing else -- which is the right call (migration 0009) but means a
// provider added here with a capital letter or a space would be rejected at
// insert time, in production, with "violates check constraint". Catching
// that here is the whole point of this file.

import assert from "node:assert/strict";
import process from "node:process";

import {
  CONNECTION_STATUSES,
  connectionGroups,
  connectionProviders,
  connectionStatusLabels,
  providerById,
  providersIn,
} from "./connections.ts";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
  }
}

// Copied from migration 0009 on purpose: if the constraint there changes,
// this assertion is meant to be the thing that notices.
const DB_PROVIDER_SHAPE = /^[a-z][a-z0-9_-]{1,38}[a-z0-9]$/;

test("every provider id satisfies the database's check constraint", () => {
  for (const provider of connectionProviders) {
    assert.match(provider.id, DB_PROVIDER_SHAPE, `${provider.id} would be rejected on insert`);
  }
});

test("provider ids are unique", () => {
  const ids = connectionProviders.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every provider belongs to a group that exists", () => {
  const groups = new Set(connectionGroups.map((g) => g.id));
  for (const provider of connectionProviders) {
    assert.ok(groups.has(provider.group), `${provider.id} is in unknown group ${provider.group}`);
  }
});

test("no group is empty", () => {
  // An empty group renders as a heading with nothing under it.
  for (const group of connectionGroups) {
    assert.ok(providersIn(group.id).length > 0, `${group.id} has no providers`);
  }
});

test("every provider tells the client what to actually do", () => {
  for (const provider of connectionProviders) {
    assert.ok(provider.howTo.trim().length > 30, `${provider.id} howTo is too thin`);
    assert.ok(provider.purpose.trim().length > 10, `${provider.id} purpose is too thin`);
    assert.ok(provider.locationLabel.trim().length > 0, `${provider.id} has no location label`);
    assert.ok(provider.locationHint.trim().length > 0, `${provider.id} has no location hint`);
  }
});

test("no provider asks the client for a credential", () => {
  // The product promise is that we never hold credentials, and the copy has
  // to keep it. The first version of this test banned the WORD "password"
  // anywhere, and it failed on the email provider -- whose instruction is
  // "a rule, not your password", which keeps the promise rather than
  // breaking it. Mentioning a credential to rule it out is the behaviour we
  // want, so what this checks is an ASK: a verb that hands something over,
  // close to the name of a secret.
  const ASKS_FOR_SECRET =
    /\b(enter|give us|share your|provide|send us|paste|type)\b[^.?!]{0,40}\b(password|api key|secret|access token|oauth token|credentials|login details)\b/i;

  for (const provider of connectionProviders) {
    const copy = `${provider.purpose} ${provider.howTo} ${provider.locationHint}`;
    assert.doesNotMatch(copy, ASKS_FOR_SECRET, `${provider.id}: ${copy}`);
  }
});

test("the credential test would catch a provider that did ask", () => {
  // A test that cannot fail is not a test. This is the assertion above,
  // pointed at copy that genuinely asks for a secret.
  const ASKS_FOR_SECRET =
    /\b(enter|give us|share your|provide|send us|paste|type)\b[^.?!]{0,40}\b(password|api key|secret|access token|oauth token|credentials|login details)\b/i;

  assert.match("Enter your Xero password below.", ASKS_FOR_SECRET);
  assert.match("Paste your API key here to connect.", ASKS_FOR_SECRET);
  assert.doesNotMatch("A rule, not your password — we never ask for mailbox access.", ASKS_FOR_SECRET);
});

test("providerById finds every provider and nothing else", () => {
  for (const provider of connectionProviders) {
    assert.equal(providerById(provider.id)?.id, provider.id);
  }
  assert.equal(providerById("google-drive"), undefined, "underscores, not hyphens, for Drive");
  assert.equal(providerById(""), undefined);
});

test("the statuses match the ones the database allows", () => {
  // Also copied from migration 0009. The DB enumerates status on purpose --
  // it is part of the schema's contract, not a catalogue of sellable things.
  assert.deepEqual([...CONNECTION_STATUSES], ["requested", "connected", "revoked"]);
  for (const status of CONNECTION_STATUSES) {
    assert.ok(connectionStatusLabels[status], `${status} has no label`);
  }
});

test("a status label never leaks the raw column value", () => {
  for (const status of CONNECTION_STATUSES) {
    assert.notEqual(connectionStatusLabels[status], status);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
