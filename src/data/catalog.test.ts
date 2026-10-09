// Run with: node --experimental-strip-types src/data/catalog.test.ts
//
// The catalog is the single source of truth for every price on the site.
// These are not type checks -- the compiler does those. They are the
// claims the business makes, asserted: that there are nineteen services,
// that the six on the homepage are the six that were agreed, that a
// "from" price can never be silently charged as if it were the price,
// and that nothing retired can reach a customer.

import assert from "node:assert/strict";
import process from "node:process";

import {
  activeServices,
  archivedServices,
  categories,
  featuredServices,
  formatPrice,
  needsQuote,
  packages,
  serviceById,
  services,
  servicesIn,
  SERVICE_COUNT,
} from "./catalog.ts";

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

test("nineteen services, as agreed", () => {
  assert.equal(SERVICE_COUNT, 19);
  assert.equal(activeServices.length, 19);
});

test("every service id is unique and follows BIZ-nn", () => {
  const ids = services.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate service id");
  for (const id of ids) assert.match(id, /^BIZ-\d{2}$/);
});

test("the six featured services are the six that were agreed, at the agreed prices", () => {
  // Pinned by id AND price. A card on the homepage quoting a number the
  // checkout does not charge is the single most expensive kind of
  // mistake this file can make.
  const expected = [
    ["BIZ-01", 25, "one_time"],
    ["BIZ-05", 39, "one_time"],
    ["BIZ-07", 19, "one_time"],
    ["BIZ-10", 49, "one_time"],
    ["BIZ-14", 39, "one_time"],
    ["BIZ-17", 99, "monthly"],
  ] as const;
  assert.equal(featuredServices.length, 6);
  for (const [id, price, billing] of expected) {
    const s = serviceById(id);
    assert.ok(s, `${id} missing`);
    assert.equal(s!.featured, true, `${id} is not featured`);
    assert.equal(s!.priceUsd, price, `${id} price moved`);
    assert.equal(s!.billing, billing, `${id} billing type moved`);
  }
});

test("every agreed price is exactly what the brief specified", () => {
  const sheet: Record<string, [number, "one_time" | "monthly"]> = {
    "BIZ-01": [25, "one_time"], "BIZ-02": [39, "one_time"], "BIZ-03": [29, "one_time"],
    "BIZ-04": [19, "one_time"], "BIZ-05": [39, "one_time"], "BIZ-06": [29, "one_time"],
    "BIZ-07": [19, "one_time"], "BIZ-08": [29, "one_time"], "BIZ-09": [29, "one_time"],
    "BIZ-10": [49, "one_time"], "BIZ-11": [59, "monthly"], "BIZ-12": [29, "monthly"],
    "BIZ-13": [25, "one_time"], "BIZ-14": [39, "one_time"], "BIZ-15": [99, "monthly"],
    "BIZ-16": [79, "monthly"], "BIZ-17": [99, "monthly"], "BIZ-18": [79, "monthly"],
    "BIZ-19": [49, "monthly"],
  };
  assert.equal(Object.keys(sheet).length, 19);
  for (const [id, [price, billing]] of Object.entries(sheet)) {
    const s = serviceById(id);
    assert.ok(s, `${id} missing from the catalog`);
    assert.equal(s!.priceUsd, price, `${id} should be $${price}`);
    assert.equal(s!.billing, billing, `${id} should be ${billing}`);
  }
});

test("only the two 'starting from' services need a quote", () => {
  // BIZ-10 bookkeeping and BIZ-13 documents are floors, not prices.
  // Charging a floor as if it were the price is how work starts
  // underpaid, so the order flow keys off this.
  const quoted = activeServices.filter(needsQuote).map((s) => s.id).sort();
  assert.deepEqual(quoted, ["BIZ-10", "BIZ-13"]);
});

test("a 'from' price always reads as a floor", () => {
  assert.equal(formatPrice(serviceById("BIZ-10")!), "from $49");
  assert.equal(formatPrice(serviceById("BIZ-13")!), "from $25");
  assert.equal(formatPrice(serviceById("BIZ-01")!), "$25");
  assert.equal(formatPrice(serviceById("BIZ-17")!), "$99/month");
});

test("every service carries the scope a customer needs before buying", () => {
  // A price with no stated limit is how a $99 service gets asked to do
  // $900 of work, and the argument afterwards has no written answer.
  for (const s of activeServices) {
    assert.ok(s.deliverables.length > 0, `${s.id} has no deliverables`);
    assert.ok(s.scopeLimits.length > 0, `${s.id} has no scope limits`);
    assert.ok(s.exclusions.length > 0, `${s.id} has no exclusions`);
    assert.ok(s.customerInputs.length > 0, `${s.id} asks for nothing from the customer`);
    assert.ok(s.deliveryEstimate.length > 0, `${s.id} has no delivery estimate`);
  }
});

test("the categories hold every service between them", () => {
  const counted = categories.reduce((n, c) => n + servicesIn(c.id).length, 0);
  assert.equal(counted, SERVICE_COUNT, "a service is in no category, or in two");
  assert.deepEqual(
    categories.map((c) => servicesIn(c.id).length),
    [6, 7, 6]
  );
});

test("three packages, at the agreed prices and billing", () => {
  assert.equal(packages.length, 3);
  assert.deepEqual(
    packages.map((p) => [p.name, p.priceUsd, p.billing]),
    [
      ["Business Launch Kit", 69, "one_time"],
      ["Back-Office Essential", 79, "monthly"],
      ["Business Operations Plus", 149, "monthly"],
    ]
  );
});

test("a monthly package always states its terms, a one-time one never pretends to", () => {
  // Renewal and cancellation have to be on screen wherever a recurring
  // charge is sold.
  for (const p of packages) {
    if (p.billing === "monthly") {
      assert.ok(p.terms && p.terms.length > 0, `${p.name} is monthly and states no terms`);
      assert.match(p.terms!, /cancel/i, `${p.name} does not say how to cancel`);
    } else {
      assert.equal(p.terms, null, `${p.name} is one-time but carries monthly terms`);
    }
  }
});

test("every package references real services", () => {
  for (const p of packages) {
    assert.ok(p.serviceIds.length > 0, `${p.name} maps to no services`);
    for (const id of p.serviceIds) {
      assert.ok(serviceById(id), `${p.name} references ${id}, which does not exist`);
    }
  }
});

test("nothing archived can be ordered", () => {
  // The brief's words: do not hide the old cards and leave the services
  // live in the ordering system. activeServices is what the site renders,
  // so this is the assertion that keeps that true.
  assert.equal(archivedServices.length, 12, "the twelve retired marketing services");
  const activeIds = new Set(activeServices.map((s) => s.id));
  for (const a of archivedServices) {
    assert.ok(!activeIds.has(a.id), `${a.id} is archived and still orderable`);
    assert.ok(a.note.length > 0, `${a.id} has no explanation`);
  }
});

test("an archived service that has a successor points at a real one", () => {
  for (const a of archivedServices) {
    if (a.replacedBy) {
      assert.ok(serviceById(a.replacedBy), `${a.id} points at ${a.replacedBy}, which does not exist`);
    }
  }
});

test("no service claims an instant turnaround", () => {
  // Twenty-minute delivery is .click's promise and it does not belong
  // here. Nothing in this catalog is standardized enough to make it.
  for (const s of activeServices) {
    assert.doesNotMatch(s.deliveryEstimate, /minute|instant|immediate/i, `${s.id}: ${s.deliveryEstimate}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
