import { ChatLauncher } from "../components/ChatLauncher";
import { BillingSection } from "../components/dashboard/BillingSection";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { RequestsSection } from "../components/dashboard/RequestsSection";
import { ServicesSection } from "../components/dashboard/ServicesSection";
import { WelcomeSection } from "../components/dashboard/WelcomeSection";
import {
  amountOutstanding,
  useBilling,
  useProfile,
  useRequests,
  useSubscriptions,
} from "../lib/dashboardData";

/**
 * Start something, see what's open, and settle up. Same three jobs as
 * .click's dashboard, with .biz's own middle section: there is no instant
 * delivery here, so what sits between "pick a service" and "pay" is the
 * scoping conversation, and open requests are where a client watches it
 * happen.
 *
 * Finished and in-flight work is at /projects, not at the bottom of this
 * page -- the mistake .click made first and fixed.
 */
export function Dashboard() {
  const { profile } = useProfile();
  const requests = useRequests();
  const billing = useBilling();
  const subscriptions = useSubscriptions();

  const outstanding = amountOutstanding(billing.rows);

  return (
    <DashboardShell title="Dashboard">
      <WelcomeSection profile={profile} outstanding={outstanding} />
      <ServicesSection />
      <RequestsSection
        requests={requests.rows}
        loading={requests.loading}
        failed={requests.failed}
        reload={requests.reload}
      />
      <BillingSection billing={billing} subscriptions={subscriptions} outstanding={outstanding} />
      <ChatLauncher />
    </DashboardShell>
  );
}
