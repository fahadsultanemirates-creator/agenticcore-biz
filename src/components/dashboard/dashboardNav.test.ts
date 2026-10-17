// Run with: node --experimental-strip-types src/components/dashboard/dashboardNav.test.ts
//
// The nav strip is a list of promises about where a client can go. This
// checks the router keeps them.
//
// That is the bug this whole change exists to fix. The dashboard listed
// areas that had no route: Orders, Messages, Invoices, Files and Account
// were named in the brief and in the old static dashboard, and a client
// who went looking for them got the SPA catch-all -- a rendered NotFound
// at HTTP 200. A nav entry and a <Route> are written in two different
// files, so nothing but a test keeps them in step.
//
// Read as text rather than imported: App.tsx pulls in the whole page
// tree and DashboardNav.tsx is JSX, neither of which survives
// --experimental-strip-types without a bundler. The strings are the
// contract here anyway.

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

const NAV = readFileSync(new URL("./DashboardNav.tsx", import.meta.url), "utf8");
const APP = readFileSync(new URL("../../App.tsx", import.meta.url), "utf8");

/** Every `to: "/…"` in the nav's AREAS list. */
function navDestinations(): string[] {
  return [...NAV.matchAll(/\{\s*to:\s*"([^"]+)"/g)].map((match) => match[1]);
}

/** Every `path="/…"` the router declares. */
function routePaths(): string[] {
  return [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
}

test("the nav lists the ten areas", () => {
  const destinations = navDestinations();
  assert.equal(
    destinations.length,
    10,
    `expected 10 areas, found ${destinations.length} — the scrape is broken or an area was dropped`,
  );
  assert.equal(new Set(destinations).size, 10, "two areas point at the same place");
});

test("the five new areas are all there", () => {
  const destinations = navDestinations();
  for (const area of ["/orders", "/messages", "/invoices", "/files", "/account"]) {
    assert.ok(destinations.includes(area), `${area} is missing from the nav`);
  }
});

test("every nav destination has a route", () => {
  const paths = new Set(routePaths());
  const orphans = navDestinations().filter((destination) => !paths.has(destination));
  assert.deepEqual(orphans, [], `nav points at ${orphans.join(", ")}, which the router has no route for`);
});

test("the scrape actually read both files", () => {
  // A regex that silently matches nothing would make the test above pass
  // for the worst possible reason.
  assert.ok(routePaths().length > 10, `only ${routePaths().length} routes found — the scrape is broken`);
  assert.ok(NAV.includes("DashboardNav"), "DashboardNav.tsx did not load");
});

test("the five new areas are behind Protected", () => {
  for (const area of ["/orders", "/messages", "/invoices", "/files", "/account"]) {
    const route = new RegExp(`<Route path="${area}" element=\\{<Protected>`);
    assert.ok(route.test(APP), `${area} is not wrapped in <Protected>`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
