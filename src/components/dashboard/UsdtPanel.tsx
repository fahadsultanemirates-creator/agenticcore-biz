import { AlertTriangle, Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import {
  AC_TOKEN_CONTRACT,
  AC_TOKEN_DISCOUNT_PCT,
  BILLING_EMAIL,
  money,
  upfrontDue,
  upfrontDueInAc,
  USDT_BEP20_ADDRESS,
} from "../../lib/payment";

/**
 * How a .biz client pays.
 *
 * Deliberately NOT .click's flow. There, an invoice carries a nonce in the
 * last decimal places so a block scanner can tell one payment from another,
 * and the exact amount is the biggest thing on screen because rounding it
 * makes the payment unmatchable. Here the amount is a plain figure and a
 * person reconciles it, because .biz prices after a conversation -- so the
 * thing a client must not get wrong is the NETWORK, not the cents.
 *
 * That is why the warning sits directly under the address rather than at the
 * bottom: USDT sent on Ethereum or Tron to a BEP-20 address is gone.
 */
export function UsdtPanel({ agreedPrice }: { agreedPrice: number }) {
  const [copied, setCopied] = useState<"usdt" | "ac" | null>(null);

  const due = upfrontDue(agreedPrice);
  const dueInAc = upfrontDueInAc(agreedPrice);

  const copy = async (which: "usdt" | "ac") => {
    try {
      await navigator.clipboard.writeText(USDT_BEP20_ADDRESS);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Some in-app browsers refuse the clipboard. The address is
      // selectable text, so there is still a way to copy it by hand.
    }
  };

  return (
    <div className="mt-4 rounded-2xl border-2 border-orange-400/60 bg-orange-400/5 p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Due now</p>
      <p className="mt-1 font-display text-3xl font-semibold text-fg tabular-nums">{money(due)}</p>
      <p className="mt-1 text-sm text-fg-muted">
        30% of {money(agreedPrice)} to start. The rest falls due when the work is approved.
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold text-fg">Pay in USDT</p>
        <p className="mt-1 text-xs text-fg-muted">
          BEP-20, on BNB Smart Chain. Send {money(due)} worth to this address:
        </p>
        <AddressRow copied={copied === "usdt"} onCopy={() => void copy("usdt")} />

        {/* Scanning beats transcribing 42 characters into a phone wallet.
            Served from public/, as the legacy dashboard did. */}
        <img
          src="/usdt-bep20-qr.png"
          alt={`QR code for the BEP-20 address ${USDT_BEP20_ADDRESS}`}
          width={160}
          height={160}
          loading="lazy"
          className="mt-3 h-40 w-40 rounded-xl border border-border bg-white p-2"
        />

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-400/40 bg-orange-400/10 px-3 py-2.5 text-xs text-fg">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
          <span>
            Only USDT on <span className="font-semibold">BEP-20</span>. USDT on Ethereum or Tron,
            or any other coin, sent to this address cannot be recovered.
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-semibold text-fg">
          Or pay in AC and save {AC_TOKEN_DISCOUNT_PCT}%
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          {money(dueInAc)} worth of AC token instead of {money(due)}. BEP-20 accepts any BEP-20
          token, so it goes to the same address — there is no second one to get wrong.
        </p>
        <AddressRow copied={copied === "ac"} onCopy={() => void copy("ac")} />
        <p className="mt-2 text-xs text-fg-faint">
          Token contract{" "}
          <a
            href={`https://bscscan.com/token/${AC_TOKEN_CONTRACT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-fg-muted hover:underline"
          >
            {AC_TOKEN_CONTRACT.slice(0, 10)}…{AC_TOKEN_CONTRACT.slice(-8)}
          </a>
          , verifiable on BscScan.
        </p>
      </div>

      {/* The one step a client must not skip. Nothing here watches the
          chain, so an unreported payment sits unnoticed. Saying so is
          better than implying it is automatic. */}
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-xs text-fg-muted">
        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
        <span>
          Once you've sent it, email your transaction hash to{" "}
          <a href={`mailto:${BILLING_EMAIL}`} className="font-semibold text-orange-400 hover:underline">
            {BILLING_EMAIL}
          </a>
          . We confirm it by hand and move your request forward — payments aren't detected
          automatically, so this step is what tells us it arrived.
        </span>
      </div>
    </div>
  );
}

function AddressRow({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-void px-3 py-2 font-mono text-xs text-fg sm:text-sm">
        {USDT_BEP20_ADDRESS}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy payment address"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-border text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
      >
        {copied ? <Check className="h-4 w-4 text-orange-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
