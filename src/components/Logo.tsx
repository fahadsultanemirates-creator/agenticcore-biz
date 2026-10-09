import logoLockup from "../assets/logo-lockup.webp";

/**
 * The whole lockup as one image, the way .click's and .agency's are.
 *
 * The black field is keyed out, so it sits on --color-void with no plate
 * behind it and the glow falls off into the page instead of ending on a
 * rectangle edge. It stacks mark-over-wordmark, so it needs the height:
 * much below h-11 the wordmark stops being readable.
 */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <img
      src={logoLockup}
      alt="AgenticCore.biz"
      className={`${compact ? "h-11" : "h-12"} w-auto shrink-0 ${className}`}
    />
  );
}
