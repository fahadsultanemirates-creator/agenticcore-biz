import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../Logo";

// In-page anchors for the sections, real routes for the pages that
// exist. Nothing here points at a page that is not built.
const LINKS = [
  { href: "#services", label: "Our Services" },
  { href: "#packages", label: "Business Packages" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#family", label: "AgenticCore Family" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-void/85 backdrop-blur transition-colors duration-300 ${
        scrolled || menuOpen ? "border-border" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <a href="/" aria-label="AgenticCore Biz home" className="shrink-0">
          <Logo compact className="sm:hidden" />
          <Logo className="hidden sm:block" />
        </a>

        <nav className="hidden items-center gap-7 font-medium text-fg-muted lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="group relative transition-colors hover:text-fg">
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-orange-400 transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
          <Link to="/create-project" className="group relative transition-colors hover:text-fg">
            Create a Project
            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-orange-400 transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/login.html"
            className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:border-orange-400/50 hover:text-fg sm:inline-flex"
          >
            Sign In
          </a>
          <a
            href="/signup.html"
            className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-void transition-transform hover:-translate-y-0.5"
          >
            Get Started Free
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg-muted transition-colors hover:text-fg lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="animate-fade-up border-t border-border bg-void px-4 pb-4 sm:px-6 lg:hidden">
          <ul className="flex flex-col py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/create-project"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 font-medium text-orange-400 transition-colors hover:bg-surface"
              >
                Create a Project
              </Link>
            </li>
            <li>
              <a
                href="/login.html"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
              >
                Sign In / Dashboard
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
