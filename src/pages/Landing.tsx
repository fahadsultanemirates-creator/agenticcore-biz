import { ChatLauncher } from "../components/ChatLauncher";
import { BusinessPoolSection } from "../components/landing/BusinessPoolSection";
import { CtaBanner } from "../components/landing/CtaBanner";
import { Footer } from "../components/landing/Footer";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Nav } from "../components/landing/Nav";
import { NoCreditsSection } from "../components/landing/NoCreditsSection";
import { RealEstateSection } from "../components/landing/RealEstateSection";
import { ServicesGrid } from "../components/landing/ServicesGrid";
import { StatsBand } from "../components/landing/StatsBand";
import { TermsSummary } from "../components/landing/TermsSummary";

export function Landing() {
  return (
    <div>
      <Nav />
      <main>
        <Hero />
        <RealEstateSection />
        <ServicesGrid />
        <HowItWorks />
        <NoCreditsSection />
        <StatsBand />
        <BusinessPoolSection />
        <TermsSummary />
        <CtaBanner />
      </main>
      <Footer />
      <ChatLauncher />
    </div>
  );
}
