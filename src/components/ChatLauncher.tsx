import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * The floating way into Forge.
 *
 * Icon-only below `sm`, with the label appearing once there is room.
 * The labelled pill is about 130px wide, and at 390px that is a third
 * of the screen parked over whatever is beneath it -- in the earlier
 * screenshots it sat across a service card's price and its tap target.
 * A 48px circle still clears Apple's and Google's minimum touch size
 * while covering a quarter of the area.
 *
 * Pages that scroll also need to end clear of it, which is why the
 * shells carry bottom padding greater than this button's height plus
 * its offset. A FAB that hides the last row of a list is a FAB that
 * loses the last item.
 */
export function ChatLauncher() {
  return (
    <Link
      to="/create-project"
      aria-label="Create a project with Forge"
      className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-orange-400 text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-3 sm:text-sm sm:font-semibold"
    >
      <Sparkles className="h-5 w-5 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Ask Forge</span>
    </Link>
  );
}
