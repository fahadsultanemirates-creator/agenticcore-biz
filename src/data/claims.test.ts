// Run with: node --experimental-strip-types src/data/claims.test.ts
//
// Claims the site makes about its own prices, checked against the prices.
//
// The homepage read "Six of the most-ordered services. Every price is
// published" directly above a grid containing BIZ-10 at "from $49".
// Nothing measures what is most ordered, and a "from" price is explicitly
// not a published final price -- so both halves of that sentence were
// wrong, and nothing would have told anyone.

import assert from "node:assert/strict";
import process from "node:process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PRICE_CAVEAT,
  activeServices,
  featuredServices,
  formatPrice,
  hasStartingFromPrice,
  packages,
  startingFromCount,
} from "./catalog.ts";

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

function code(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

const FEATURED = code("../components/landing/FeaturedServices.tsx");
const SERVICES = code("../pages/Services.tsx");
const PACKAGES = code("../pages/Packages.tsx");

test("the caveat actually says a 'from' price is not final", () => {
  assert.match(PRICE_CAVEAT, /from/i);
  assert.match(PRICE_CAVEAT, /starting point|quote/i);
});

test("the catalogue still has 'from' prices, so these tests are not vacuous", () => {
  assert.ok(
    startingFromCount(activeServices) > 0,
    "no service is priced 'from' — the caveat tests below would pass trivially",
  );
  assert.ok(
    hasStartingFromPrice(featuredServices),
    "the featured six no longer contains a 'from' price; re-check whether the caveat is still needed",
  );
});

test("no page claims every price is published or final", () => {
  // "Published" reads as "this is the price". It is not, for BIZ-10 and
  // BIZ-13.
  for (const [name, body] of [
    ["FeaturedServices", FEATURED],
    ["Services", SERVICES],
  ] as const) {
    assert.ok(
      !/every price (is )?published/i.test(body),
      `${name} still claims every price is published`,
    );
    assert.ok(!/final price/i.test(body), `${name} claims a final price`);
  }
});

test("no page ranks its services without a source", () => {
  for (const [name, body] of [
    ["FeaturedServices", FEATURED],
    ["Services", SERVICES],
  ] as const) {
    for (const claim of [/most[- ]ordered/i, /most popular/i, /best[- ]sell/i, /\bno\.?\s?1\b/i]) {
      assert.ok(!claim.test(body), `${name} makes the ranking claim ${claim}`);
    }
  }
});

test("any page showing a 'from' price also shows the caveat", () => {
  for (const [name, body] of [
    ["FeaturedServices", FEATURED],
    ["Services", SERVICES],
  ] as const) {
    assert.ok(body.includes("PRICE_CAVEAT"), `${name} shows prices without the caveat`);
    assert.ok(
      body.includes("hasStartingFromPrice"),
      `${name} hardcodes the caveat instead of deriving it from the catalogue`,
    );
  }
});

test("the packages page renders every package in the data", () => {
  // The owner reported /packages not rendering. It renders -- but nothing
  // tied the page to the data, so a package added to the catalogue and
  // missing from the page would have looked identical to a working page.
  assert.equal(packages.length, 3, "expected three packages");
  assert.ok(
    PACKAGES.includes("packages.map") || PACKAGES.includes("packages .map"),
    "Packages.tsx does not map over the catalogue, so the two can drift",
  );
  for (const bundle of packages) {
    assert.ok(formatPrice(bundle).startsWith("$"), `${bundle.id} has no renderable price`);
  }
});

test("every package price is at or below the sum of what it contains", () => {
  // A bundle that costs more than its parts is a bug, not a discount.
  for (const bundle of packages) {
    const parts = bundle.serviceIds
      .map((id) => activeServices.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    assert.equal(parts.length, bundle.serviceIds.length, `${bundle.id} references a missing service`);
    const sum = parts.reduce((total, s) => total + s.priceUsd, 0);
    assert.ok(
      bundle.priceUsd <= sum,
      `${bundle.id} costs $${bundle.priceUsd} but its parts total $${sum}`,
    );
  }
});

// ---------------------------------------------------------------------
// Forge: what the buttons promise vs what the app can do.
// ---------------------------------------------------------------------

test("no button offers a chat unless the app actually calls a chat endpoint", () => {
  // The landing page had a "Chat with Forge" button pointing at
  // /create-project?mode=chat. CreateProject read that param into a
  // ternary whose branches were both "describe", so the mode never
  // existed -- and nothing in src calls forge-chat at all. The button
  // promised a conversation the site cannot hold.
  //
  // This is the invariant, not the wording: a conversational CTA is
  // allowed the moment something actually invokes the chat endpoint.
  const src = new URL("..", import.meta.url).pathname;
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(full) && !/\.test\.[cm]?tsx?$/.test(full)) files.push(full);
    }
  };
  walk(src);

  const callsChat = files.some((f) => /invoke\(\s*["'`]forge-chat|functions\/v1\/forge-chat/.test(readFileSync(f, "utf8")));

  const offers: string[] = [];
  for (const file of files) {
    const body = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");
    // Only user-visible CTA text, not identifiers like ChatLauncher.
    for (const m of body.matchAll(/>\s*([^<>{}]*\b(?:chat with|ask forge)\b[^<>{}]*?)\s*</gi)) {
      offers.push(`${file.replace(src, "src/")}: ${m[1].trim()}`);
    }
    if (/\bmode=chat\b/.test(body)) offers.push(`${file.replace(src, "src/")}: links to ?mode=chat`);
  }

  if (!callsChat) assert.deepEqual(offers, []);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
