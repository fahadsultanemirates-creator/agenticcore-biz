import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Services } from "./pages/Services";
import { Signup } from "./pages/Signup";

/**
 * Routes the React app owns.
 *
 * Eager above, lazy below. A first-time visitor should not download the
 * dashboard, the request form and the project pages before the landing page
 * can paint -- none of which they can reach without an account. The four
 * routes a signed-out visitor actually touches stay eager; the rest arrive
 * when they are needed.
 *
 * Still NOT React, and still served by Netlify at their own URLs because a
 * matching file beats the SPA redirect: /admin.html, /terms.html,
 * /privacy.html, /referral.html, /business-pool.html, /how-it-works.html.
 * The auth pages and the client dashboard that used to live there are gone,
 * and netlify.toml redirects their old addresses here.
 */
const ServiceDetail = lazy(() =>
  import("./pages/ServiceDetail").then((m) => ({ default: m.ServiceDetail })),
);
const Packages = lazy(() => import("./pages/Packages").then((m) => ({ default: m.Packages })));
const CreateProject = lazy(() =>
  import("./pages/CreateProject").then((m) => ({ default: m.CreateProject })),
);
const ResetPassword = lazy(() =>
  import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })),
);
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const RequestService = lazy(() =>
  import("./pages/RequestService").then((m) => ({ default: m.RequestService })),
);
const Projects = lazy(() => import("./pages/Projects").then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() =>
  import("./pages/ProjectDetail").then((m) => ({ default: m.ProjectDetail })),
);
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

// Deliberately blank rather than a spinner. These chunks load in a fraction
// of a second on any normal connection, and a spinner that flashes for 80ms
// reads as a glitch.
const LOADING = <div className="min-h-screen bg-void" />;

function Protected({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function App() {
  return (
    <Suspense fallback={LOADING}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/create-project" element={<CreateProject />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset" element={<ResetPassword />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route
          path="/dashboard/request/:id"
          element={<Protected><RequestService /></Protected>}
        />
        <Route path="/projects" element={<Protected><Projects /></Protected>} />
        <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
