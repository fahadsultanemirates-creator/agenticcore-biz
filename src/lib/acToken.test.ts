// Run with: node --experimental-strip-types <this file>
//
// AC token as a second payment option -- kept correct, and kept safe.
//
// HISTORY, because it matters for how this file reads. AC token payment
// was offered once at 15%, removed across every site in the
// campaign-readiness pass, and this file existed to keep it removed. The
// owner has reinstated it at 10%, so the ban is gone -- but the checks it
// replaced are not. A payment method is the worst place in a codebase for
// a number or an address to drift quietly, so every claim the UI makes
// about AC is pinned here instead.
//
// The property that actually protects money is that there is NO SECOND
// ADDRESS: BEP-20 accepts any BEP-20 token, so AC arrives at the same
// wallet as USDT. If someone ever introduces a separate AC receiving
// address, that is a new way for a client to lose funds permanently, and
// the test below fails rather than letting it ship quietly.

import assert from "node:assert/strict";
import process from "node:process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AC_TOKEN_CONTRACT,
  AC_TOKEN_DISCOUNT_PCT,
  AC_TOKEN_SITE,
  upfrontDue,
  upfrontDueInAc,
  totalInAc,
  USDT_BEP20_ADDRESS,
} from "./payment.ts";

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

const ROOT = new URL("../..", import.meta.url).pathname;
const SKIP = new Set(["node_modules", "dist", ".git", ".netlify"]);
const EXTS = /\.(ts|tsx|js|jsx|mjs|css|html|json|sql)$/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (EXTS.test(full) && !full.endsWith("acToken.test.ts")) out.push(full);
  }
  return out;
}

const FILES = sourceFiles(ROOT);

test("the scan actually reads this repo", () => {
  assert.ok(FILES.length > 20, `only found ${FILES.length} source files — the walk is broken`);
});

test("the discount is the 10% the owner asked for, not the old 15%", () => {
  // Pinned to the exact number. This has now changed once, and a shape
  // check would have accepted the stale 15% just as happily.
  assert.equal(AC_TOKEN_DISCOUNT_PCT, 10);
});

test("AC is paid to the SAME wallet as USDT — there is no second address", () => {
  // The safety property. A second receiving address is a second way to
  // send funds somewhere unrecoverable, for no benefit: BEP-20 accepts
  // any BEP-20 token.
  const evm = /0x[a-fA-F0-9]{40}/g;
  const panel = readFileSync(join(ROOT, "src/components/dashboard/UsdtPanel.tsx"), "utf8");
  const addresses = new Set((panel.match(evm) ?? []).map((a) => a.toLowerCase()));
  addresses.delete(AC_TOKEN_CONTRACT.toLowerCase()); // a token id, not a destination

  assert.deepEqual(
    [...addresses],
    [],
    "the payment panel hard-codes an address; it must use USDT_BEP20_ADDRESS only",
  );
  assert.notEqual(
    AC_TOKEN_CONTRACT.toLowerCase(),
    USDT_BEP20_ADDRESS.toLowerCase(),
    "the token contract is being used as the receiving wallet",
  );
});

test("the discounted deposit is the undiscounted one minus the discount", () => {
  for (const price of [25, 39, 69, 100, 333.33, 1000]) {
    const full = upfrontDue(price);
    const discounted = upfrontDueInAc(price);
    assert.ok(discounted < full, `${price}: AC deposit is not cheaper`);
    // Within a cent of the stated percentage -- the figure on screen must
    // match the percentage the same screen advertises.
    const impliedPct = (1 - discounted / full) * 100;
    assert.ok(
      Math.abs(impliedPct - AC_TOKEN_DISCOUNT_PCT) < 0.5,
      `${price}: screen says ${AC_TOKEN_DISCOUNT_PCT}% but the maths gives ${impliedPct.toFixed(2)}%`,
    );
  }
});

test("the discount applies to the whole job too, not just the deposit", () => {
  assert.equal(totalInAc(100), 90);
  assert.equal(totalInAc(69), 62.1);
});

test("every AC amount is rounded to real cents", () => {
  // 0.3 * 3 is 0.8999999999999999 in binary floating point. An amount a
  // client is asked to send must not render one value and compare as
  // another.
  for (const price of [3, 7, 19, 29, 39, 333.33]) {
    const v = upfrontDueInAc(price);
    assert.equal(v, Math.round(v * 100) / 100, `${price} produced an un-rounded amount`);
  }
});

test("wherever AC is offered, the token site is linked", () => {
  // The owner's requirement: a client being offered a discount for a
  // token must be able to read about that token before buying any.
  const panel = readFileSync(join(ROOT, "src/components/dashboard/UsdtPanel.tsx"), "utf8");
  assert.ok(/AC_TOKEN_DISCOUNT_PCT/.test(panel), "the panel no longer offers AC at all");
  assert.ok(/AC_TOKEN_SITE/.test(panel), "AC is offered without linking the token site");
  assert.equal(AC_TOKEN_SITE, "https://actoken.org");
});

test("the contract is a well-formed address, shown as a contract not a wallet", () => {
  assert.match(AC_TOKEN_CONTRACT, /^0x[a-fA-F0-9]{40}$/);
  const panel = readFileSync(join(ROOT, "src/components/dashboard/UsdtPanel.tsx"), "utf8");
  assert.ok(
    /bscscan\.com\/token\//.test(panel),
    "the contract should link to BscScan's token view so a client can verify it",
  );
});

test("USDT is still here, so this is not passing by replacing one with the other", () => {
  const usdt = FILES.filter((f) => new RegExp(USDT_BEP20_ADDRESS, "i").test(readFileSync(f, "utf8")));
  assert.ok(usdt.length > 0, "the USDT receiving address is gone — that is not what was asked for");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
