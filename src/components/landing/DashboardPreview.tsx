import dashboardPreview from "../../assets/dashboard-preview.webp";

/**
 * The dashboard artwork on the landing page.
 *
 * This was a panel built out of lucide icons and six sample tiles, with a
 * note explaining why: "the brief is explicit about not publishing
 * invented customer results or fabricated revenue growth, and a mock that
 * looks like a real account is one screenshot away from being quoted as
 * one." The owner has since supplied the orange artwork and asked for it
 * here, and .agency already ships the equivalent image.
 *
 * That original concern is still right, so the caption is not decoration:
 * the artwork shows figures nobody earned -- 1,248 leads, $28,430
 * attributed, 312% ROI -- and the line under it says so in the same
 * words .agency uses. An image like this without that line is a
 * fabricated results claim.
 *
 * It replaces src/assets/dashboard-preview.webp, which was the old blue
 * illustration: off-brand for an orange site, and referenced by nothing.
 */
export function DashboardPreview() {
  return (
    <figure
      className="animate-fade-up mx-auto mt-16 max-w-5xl md:mt-20"
      style={{ animationDelay: "150ms" }}
    >
      <img
        src={dashboardPreview}
        alt="Illustration of the AgenticCore.biz dashboard: campaigns, leads, SEO, content planning and reporting."
        width={1400}
        height={788}
        // Above the fold on a desktop, so it should not wait for a
        // lazy-load pass to start fetching.
        fetchPriority="high"
        className="h-auto w-full rounded-xl"
      />
      <figcaption className="mt-3 text-center text-xs text-fg-faint">
        Illustration of the customer dashboard. Figures shown are for the example, not customer
        results.
      </figcaption>
    </figure>
  );
}
