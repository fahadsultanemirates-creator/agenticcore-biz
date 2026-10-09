// Run with: node --experimental-strip-types src/lib/payment.test.ts
//
// These are the money rules. A wrong answer here is a wrong invoice, and a
// wrong receiving address is money that cannot be recovered -- so the
// addresses are pinned by value, not just checked for shape.

import assert from "node:assert/strict";
import process from "node:process";

import {
  AC_TOKEN_CONTRACT,
  AC_TOKEN_DISCOUNT_PCT,
  BUSINESS_POOL_THRESHOLD,
  UPFRONT_FRACTION,
  USDT_BEP20_ADDRESS,
  businessPoolProgress,
  businessPoolRemaining,
  money,
  remainderDue,
  roundMoney,
  upfrontDue,
  upfrontDueInAc,
} from "./payment.ts";

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

test("the receiving address is the one the site has always used", () => {
  // Pinned by value on purpose. A typo here sends a client's payment
  // somewhere unrecoverable, and no test that only checks the shape of an
  // address would catch it.
  assert.equal(USDT_BEP20_ADDRESS, "0x62Ad7D55fbc8A8591109D72b67Ec63aa1EE196bC");
  assert.equal(AC_TOKEN_CONTRACT, "0xe9568888a0bc317519957047cf736e134B097768");
});

test("both addresses are well-formed EVM addresses", () => {
  for (const address of [USDT_BEP20_ADDRESS, AC_TOKEN_CONTRACT]) {
    assert.match(address, /^0x[0-9a-fA-F]{40}$/, address);
  }
});

test("the agreed business terms are what they have always been", () => {
  assert.equal(UPFRONT_FRACTION, 0.3);
  assert.equal(AC_TOKEN_DISCOUNT_PCT, 15);
  assert.equal(BUSINESS_POOL_THRESHOLD, 5000);
});

test("a deposit is 30 per cent of the agreed price", () => {
  assert.equal(upfrontDue(100), 30);
  assert.equal(upfrontDue(69), 20.7);
  assert.equal(upfrontDue(149), 44.7);
});

test("rounding survives the cases binary floating point gets wrong", () => {
  // 3 * 0.3 is 0.8999999999999999 in IEEE 754, which is how a $3 deposit
  // becomes "$0.90" on screen and 0.8999999999999999 in a comparison.
  assert.notEqual(3 * 0.3, 0.9);
  assert.equal(upfrontDue(3), 0.9);
  assert.equal(roundMoney(0.8999999999999999), 0.9);
  // 19 is the cheapest thing in the catalogue, so this is a real invoice.
  assert.equal(upfrontDue(19), 5.7);
});

test("the deposit and the remainder add back up to the agreed price", () => {
  // The one property that must hold for every price we sell: a client must
  // never be billed more or less than the total across the two stages.
  for (const price of [19, 25, 29, 39, 49, 59, 69, 79, 99, 149, 3, 7.77, 1234.56]) {
    assert.equal(
      roundMoney(upfrontDue(price) + remainderDue(price)),
      roundMoney(price),
      `${price} split into ${upfrontDue(price)} + ${remainderDue(price)}`,
    );
  }
});

test("paying in AC takes 15 per cent off the deposit", () => {
  assert.equal(upfrontDueInAc(100), 25.5);
  assert.equal(upfrontDueInAc(69), 17.6);
  // Never more than the USDT deposit, for any price we sell.
  for (const price of [19, 25, 29, 39, 49, 59, 69, 79, 99, 149]) {
    assert.ok(upfrontDueInAc(price) < upfrontDue(price), `${price}`);
  }
});

test("Business Pool progress is a percentage that cannot overshoot", () => {
  assert.equal(businessPoolProgress(0), 0);
  assert.equal(businessPoolProgress(-10), 0);
  assert.equal(businessPoolProgress(2500), 50);
  assert.equal(businessPoolProgress(5000), 100);
  assert.equal(businessPoolProgress(999999), 100);
});

test("Business Pool remaining reaches zero and stays there", () => {
  assert.equal(businessPoolRemaining(0), 5000);
  assert.equal(businessPoolRemaining(4999.5), 1);
  assert.equal(businessPoolRemaining(5000), 0);
  assert.equal(businessPoolRemaining(6000), 0);
});

test("money always shows two decimal places and thousands separators", () => {
  assert.equal(money(0), "$0.00");
  assert.equal(money(20.7), "$20.70");
  assert.equal(money(5.7), "$5.70");
  assert.equal(money(1234.5), "$1,234.50");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
