import { Mail } from "lucide-react";
import type { ComponentType } from "react";
import { Logo } from "../Logo";
import { FacebookIcon, InstagramIcon, XIcon, YouTubeIcon } from "../icons/SocialIcons";
import { TelegramIcon } from "../icons/TelegramIcon";

// Every link here is one that already existed on the pre-React pages.
// A footer that invents a channel nobody runs is a dead end with a logo.
const SOCIALS: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "https://x.com/AgenticCoreHQ", label: "X", icon: XIcon },
  { href: "https://www.facebook.com/share/1HppKFetgD/", label: "Facebook", icon: FacebookIcon },
  { href: "https://instagram.com/agenticcore.agency", label: "Instagram", icon: InstagramIcon },
  { href: "https://youtube.com/@AgenticcoreAgency", label: "YouTube", icon: YouTubeIcon },
];

/** The two policy pages, kept as pages of their own. */

const LEGAL = [
  { href: "/terms.html", label: "Terms" },
  { href: "/privacy.html", label: "Privacy" },
];

/**
 * The family, repeated small in the footer.
 *
 * Each says what it is FOR, because the whole purpose of these links is
 * to stop somebody ordering a custom dashboard as back-office support.
 */
const ELSEWHERE = [
  { href: "https://agenticcore.click", label: "agenticcore.click — quick standardized digital tasks" },
  { href: "https://agenticcore.agency", label: "agenticcore.agency — custom websites, apps and AI systems" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-void px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10">
        <div className="flex w-full flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo />
            <p className="text-sm text-fg-faint">
              Business setup, back-office and managed support.
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-fg-muted">
            {LEGAL.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-fg">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">Need help?</p>
          <div className="flex items-center gap-3">
            <a
              href="mailto:hello@agenticcore.biz"
              aria-label="Email us"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-400 text-void transition-transform hover:-translate-y-0.5"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/AgenticCoreAgency"
              target="_blank"
              rel="noreferrer"
              aria-label="Support on Telegram"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-400 text-void transition-transform hover:-translate-y-0.5"
            >
              <TelegramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold tracking-wide text-fg-faint uppercase">Follow us</p>
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-xs text-fg-faint">
          {ELSEWHERE.map((site) => (
            <a key={site.href} href={site.href} className="transition-colors hover:text-fg-muted">
              {site.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-fg-faint">
          © {new Date().getFullYear()} agenticcore.biz
        </p>
      </div>
    </footer>
  );
}
