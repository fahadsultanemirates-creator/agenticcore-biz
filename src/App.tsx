import { Route, Routes } from "react-router-dom";
import { CreateProject } from "./pages/CreateProject";
import { Landing } from "./pages/Landing";
import { Packages } from "./pages/Packages";
import { ServiceDetail } from "./pages/ServiceDetail";
import { Services } from "./pages/Services";

/**
 * Routes the React app owns.
 *
 * The public side is complete: landing, the full service directory, a
 * detail page per service, the packages page and project creation. Every
 * link on the homepage goes to one of these.
 *
 * Everything behind the login -- sign in, sign up, dashboard, admin --
 * is still the pre-React site in public/, served by Netlify at the URLs
 * it always had, because a matching file beats the SPA redirect. That is
 * the next phase, and until it lands those pages keep working as they
 * always have.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/:id" element={<ServiceDetail />} />
      <Route path="/packages" element={<Packages />} />
      <Route path="/create-project" element={<CreateProject />} />
    </Routes>
  );
}
