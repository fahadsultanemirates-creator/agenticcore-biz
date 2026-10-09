/**
 * What a client owes, and where it goes.
 *
 * These numbers were buried in string templates inside public/dashboard.js,
 * recomputed inline at each use. They are business rules -- the kind where
 * being out by a rounding step means invoicing the wrong amount -- so they
 * live here, in one place, with tests.
 *
 * Nothing here talks to the chain. .biz takes payment by agreement after a
 * conversation, so a payment is matched by a human reading the transaction
 * hash a client sends, not by a block scanner. That is a deliberate
 * difference from .click and .agency, which issue per-invoice amounts with a
 * nonce in the decimals precisely so a machine can match them.
 */

/** BEP-20 on BNB Smart Chain. The same receiving wallet the legacy
 *  dashboard has always shown, and the same one .click settles to. */
export const USDT_BEP20_ADDRESS = "0x62Ad7D55fbc8A8591109D72b67Ec63aa1EE196bC";

/** AgenticCore's own BEP-20 token. BEP-20 accepts any BEP-20 token, so it
 *  arrives at the wallet above -- there is no second address to get wrong. */
export const AC_TOKEN_CONTRACT = "0xe9568888a0bc317519957047cf736e134B097768";

/** Paying in AC earns this much off. */
export const AC_TOKEN_DISCOUNT_PCT = 15;

/** Taken before work starts; the remainder falls due on approval. */
export const UPFRONT_FRACTION = 0.3;

/** Lifetime spend that unlocks Business Pool. */
export const BUSINESS_POOL_THRESHOLD = 5000;

export const BILLING_EMAIL = "hello@agenticcore.biz";

/**
 * Round to cents the way an invoice does.
 *
 * Decimal money in binary floating point does not land on exact cents:
 * 0.3 * 3 is 0.8999999999999999, so a $3 deposit would render as "$0.90"
 * in one place and be compared as 0.8999999999999999 in another. Every
 * amount shown or stored goes through here.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** The deposit due before work starts, from the agreed total. */
export function upfrontDue(agreedPrice: number): number {
  return roundMoney(agreedPrice * UPFRONT_FRACTION);
}

/** The same deposit, discounted for paying in AC. */
export function upfrontDueInAc(agreedPrice: number): number {
  return roundMoney(upfrontDue(agreedPrice) * (1 - AC_TOKEN_DISCOUNT_PCT / 100));
}

/** What is left once the deposit is paid. */
export function remainderDue(agreedPrice: number): number {
  return roundMoney(agreedPrice - upfrontDue(agreedPrice));
}

/** How far through Business Pool a client is, as a 0-100 percentage. */
export function businessPoolProgress(totalSpend: number): number {
  if (totalSpend <= 0) return 0;
  const pct = (totalSpend / BUSINESS_POOL_THRESHOLD) * 100;
  return Math.min(100, Math.round(pct));
}

/** Dollars left before Business Pool unlocks, rounded to whole dollars. */
export function businessPoolRemaining(totalSpend: number): number {
  return Math.max(0, Math.ceil(BUSINESS_POOL_THRESHOLD - totalSpend));
}

/** $1,234.50 — never "$1234.5". */
export function money(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
