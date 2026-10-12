/**
 * The payment split, in one place.
 *
 * It was stated only inside public/terms.html -- a file the React site never
 * referenced and nobody maintaining React read. The rest of the site never
 * mentioned a split at all, so a customer could order, pay, and only then
 * discover that 70% was still outstanding. Both the Terms page and the
 * ordering flow now read these numbers, so the site cannot quote one split
 * while the agreement states another.
 */
export const PAYMENT_SPLIT = {
  upfrontPercent: 30,
  onCompletionPercent: 70,
} as const;

/** "30% upfront, 70% on completion" -- the phrasing used across the site. */
export function paymentSplitSentence(): string {
  const { upfrontPercent, onCompletionPercent } = PAYMENT_SPLIT;
  return `${upfrontPercent}% upfront to begin work, ${onCompletionPercent}% on completion`;
}

/** The same split as it applies to an ongoing monthly service. */
export const MONTHLY_BILLING_NOTE =
  "Ongoing monthly services are billed on the agreed date each cycle rather than split.";
