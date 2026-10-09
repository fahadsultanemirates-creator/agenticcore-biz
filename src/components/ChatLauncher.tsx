import { MessageSquare } from "lucide-react";

/**
 * The way into a conversation, on every public page.
 *
 * It matters more here than on the other two sites. .biz will not start
 * work without a discovery call -- "we don't give blind promises" is the
 * pitch -- so the thing a visitor most needs is a way to talk to someone,
 * not a checkout.
 *
 * Still the legacy chat page for now; it becomes a route in phase 2.
 */
export function ChatLauncher() {
  return (
    <a
      href="/how-it-works.html#discovery"
      className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-orange-400 px-4 py-3 text-sm font-semibold text-void shadow-glow-orange transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:px-5"
    >
      <MessageSquare className="h-4 w-4" />
      Talk it through
    </a>
  );
}
