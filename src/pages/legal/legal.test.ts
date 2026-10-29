// Run with: node --experimental-strip-types src/pages/legal/legal.test.ts
//
// The legal pages are the one place on this site where being out of date is
// not a cosmetic problem: the signup consent checkbox links to them, so
// whatever they say is what every new account has agreed to.
//
// They went stale precisely because nothing checked them. They lived in
// public/*.html, Netlify served them ahead of the SPA, and they ended up
// describing chatbots, voice agents, real estate developers and AC token
// payments -- none of which this business sells -- plus a 30/70 payment
// split the rest of the site never mentioned.

import assert from "node:assert/strict";
import { AC_TOKEN_DISCOUNT_PCT } from "../../lib/payment.ts";
import process from "node:process";
import { readFileSync } from "node:fs";
import { activeServices } from "../../data/catalog.ts";
import { PAYMENT_SPLIT, paymentSplitSentence } from "../../data/paymentTerms.ts";

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

/**
 * The prose a visitor actually reads, with comments removed.
 *
 * Without the strip, this file's own explanation of what was deleted would
 * match every term it is checking for -- the same false positive that made an
 * earlier version of a .click test pass on copy that *disclaimed* the thing
 * it was scanning for.
 */
function prose(file: string): string {
  const raw = readFileSync(new URL(file, import.meta.url), "utf8");
  return raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const TERMS = prose("./Terms.tsx");
const PRIVACY = prose("./Privacy.tsx");

test("the comment stripper works, or every test below is vacuous", () => {
  const raw = readFileSync(new URL("./Terms.tsx", import.meta.url), "utf8");
  // "chatbots" appears in this file's own header comment explaining what was
  // removed, and appears there contiguously -- unlike "real estate", which the
  // comment wraps across a line and which would therefore make a fixture that
  // passes whether or not the stripper does anything.
  assert.ok(raw.includes("chatbots"), "fixture: the file comment should mention chatbots");
  assert.ok(
    !TERMS.toLowerCase().includes("chatbot"),
    "the stripper left comment text in, so these tests would pass on comments alone",
  );
  assert.ok(TERMS.includes("Terms of Service"), "the stripper removed actual page copy");
});

test("no legal page describes a business AgenticCore.biz is not", () => {
  // Every one of these was in the live documents until this commit.
  // "ac token" was on this list because the page offered a payment method
  // the site did not take. It is now a real, accepted method at a 10%
  // discount, so banning the phrase would make the Terms inaccurate in the
  // opposite direction. The replacement check below holds it to being
  // described correctly instead of simply absent.
  const gone = ["chatbot", "voice agent", "real estate", "seo & content"];
  for (const page of [
    ["Terms", TERMS],
    ["Privacy", PRIVACY],
  ] as const) {
    for (const phrase of gone) {
      assert.ok(
        !page[1].toLowerCase().includes(phrase),
        `${page[0]} still mentions "${phrase}"`,
      );
    }
  }
});

test("the payment split is internally consistent", () => {
  assert.equal(
    PAYMENT_SPLIT.upfrontPercent + PAYMENT_SPLIT.onCompletionPercent,
    100,
    "the two halves of the split must add up to the whole price",
  );
  assert.ok(PAYMENT_SPLIT.upfrontPercent > 0 && PAYMENT_SPLIT.onCompletionPercent > 0);
});

test("the Terms page states the split, and states it from the shared module", () => {
  // Rendered via {upfrontPercent}/{onCompletionPercent}, so the digits must
  // NOT be typed into the copy -- a hardcoded "30%" is the bug this guards.
  assert.ok(TERMS.includes("{upfrontPercent}%"), "Terms does not render the upfront share");
  assert.ok(
    TERMS.includes("{onCompletionPercent}"),
    "Terms does not render the completion share",
  );
  assert.ok(
    !/\b(30|70)\s*%/.test(TERMS),
    "Terms hardcodes a percentage instead of reading paymentTerms.ts",
  );
});

test("the ordering flow tells the customer about the split before they commit", () => {
  const order = prose("../CreateProject.tsx");
  assert.ok(
    order.includes("paymentSplitSentence()"),
    "CreateProject does not surface the payment split, so the split lives only in Terms again",
  );
  assert.match(paymentSplitSentence(), /\d+% upfront.*\d+% on completion/);
});

test("the consent links point at routes the router actually serves", () => {
  // The old links were /terms.html and /privacy.html. Those files are gone,
  // so had the links not moved with them, signup would consent to a 404.
  const signup = prose("../Signup.tsx");
  const app = prose("../../App.tsx");
  for (const path of ["/terms", "/privacy"]) {
    assert.ok(signup.includes(`href="${path}"`), `signup does not link to ${path}`);
    assert.ok(app.includes(`path="${path}"`), `App.tsx has no route for ${path}`);
  }
  assert.ok(
    !signup.includes(".html"),
    "signup still links to a legacy .html legal page",
  );
});

test("every service category the catalogue sells is covered by the Terms", () => {
  // Not a word match on service names -- that would be brittle. The claim is
  // narrower: the Terms must not be silent about the kind of work being sold.
  const kinds = new Set(activeServices.map((s) => s.category));
  assert.ok(kinds.size >= 3, `expected at least three categories, got ${[...kinds].join(", ")}`);
  for (const topic of ["bookkeeping", "payroll", "administration"]) {
    assert.ok(
      TERMS.toLowerCase().includes(topic),
      `Terms never mentions ${topic}, which this catalogue sells`,
    );
  }
});

test("Terms carries the clauses the old Payment & Delivery Policy had none of", () => {
  for (const clause of [
    "not your accountant",
    "Ownership",
    "Cancellation and refunds",
    "Limits of liability",
    "Suspension and termination",
    "Confidentiality",
  ]) {
    assert.ok(TERMS.includes(clause), `Terms is missing the "${clause}" clause`);
  }
});

test("neither page promises to hold a credential, and both say so", () => {
  assert.ok(
    /do not (ask for|store)[\s\S]{0,120}password/i.test(TERMS) ||
      /passwords[\s\S]{0,80}not store/i.test(TERMS),
    "Terms does not state that we never hold customer credentials",
  );
  assert.ok(
    PRIVACY.toLowerCase().includes("never ask for"),
    "Privacy does not state what we never ask for",
  );
});

test("the Terms describe AC token accurately, or not at all", () => {
  // A discount quoted in the Terms is a commitment. If the page names AC
  // at all it must carry the real percentage, and that percentage must
  // come from the shared constant rather than a number typed into prose
  // -- which is exactly how the old 15% outlived the decision to drop it.
  if (!TERMS.toLowerCase().includes("ac token")) return;

  // Asserted as the interpolated constant, not the rendered number. A
  // literal "10%" typed into the prose would pass a text check and then
  // silently disagree with lib/payment.ts the day the figure moves --
  // which is how the old 15% outlived the decision to drop it.
  assert.ok(
    /\{AC_TOKEN_DISCOUNT_PCT\}%\s*discount/.test(TERMS),
    "Terms names AC token without interpolating AC_TOKEN_DISCOUNT_PCT — the figure can drift",
  );
  assert.ok(
    !/\b(10|15|20)\s*%\s*discount/.test(TERMS),
    "Terms hard-codes a discount percentage instead of using the shared constant",
  );
  assert.ok(
    /same address as\s+USDT|same address/i.test(TERMS),
    "Terms offers AC without saying it goes to the same address — the one fact that stops a lost payment",
  );
  assert.ok(
    !/\b(invest|investment|return|profit|guaranteed)\b/i.test(
      TERMS.slice(Math.max(0, TERMS.toLowerCase().indexOf("ac token") - 300),
                 TERMS.toLowerCase().indexOf("ac token") + 500),
    ),
    "the Terms discuss AC token in investment terms — it is a payment method, not an offer of return",
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
