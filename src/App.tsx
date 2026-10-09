import { Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";

// Phase 1: the React app owns "/" and nothing else yet.
//
// Everything behind the login -- the dashboard, requests, billing,
// referrals, admin -- is still the pre-React site in public/, served by
// Netlify as ordinary files at the URLs it always had. A matching file
// wins over the SPA redirect, so those pages keep working untouched.
//
// That split is exactly what went wrong on .agency, where a new landing
// page dropped visitors straight back into the old site on the first
// click and it was left that way. The difference here is that it is
// stated, scoped and scheduled: phase 2 is the dashboard and the project
// area, ported the same way, and until it lands every link off this page
// still goes somewhere that works.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}
