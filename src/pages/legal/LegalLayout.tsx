import type { ReactNode } from "react";
import { PublicShell } from "../../components/PublicShell";
import { SUPPORT_EMAIL, TELEGRAM_URL } from "../../data/contact";

/**
 * The frame for the Terms and Privacy pages.
 *
 * These lived in public/terms.html and public/privacy.html until now, which
 * meant Netlify served them ahead of the SPA and nobody maintaining React
 * ever saw them. They had drifted into describing a different business --
 * chatbots, voice agents, real estate developers, AC token payments -- while
 * the signup consent checkbox pointed straight at them.
 */
export function LegalLayout({
  title,
  eyebrow,
  intro,
  updated,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <PublicShell title={title}>
      <article className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-orange-400 uppercase">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-fg-muted">{intro}</p>
          <p className="mt-4 text-xs text-fg-muted">Last updated {updated}.</p>
        </div>

        <div className="mt-10 flex max-w-2xl flex-col gap-8">{children}</div>

        <p className="mt-12 max-w-2xl text-sm text-fg-muted">
          Questions about any of this?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-orange-400 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          or{" "}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-400 hover:underline"
          >
            Telegram
          </a>
          .
        </p>
      </article>
    </PublicShell>
  );
}

export function Clause({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-fg">{heading}</h2>
      <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-fg-muted">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}
