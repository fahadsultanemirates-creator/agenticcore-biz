import { ChatLauncher } from "../components/ChatLauncher";
import { Faq } from "../components/landing/Faq";
import { FamilySection } from "../components/landing/FamilySection";
import { FeaturedServices } from "../components/landing/FeaturedServices";
import { FinalCta } from "../components/landing/FinalCta";
import { Footer } from "../components/landing/Footer";
import { ForgeSection } from "../components/landing/ForgeSection";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Nav } from "../components/landing/Nav";
import { PackagesSection } from "../components/landing/PackagesSection";
import { WhatWeDo } from "../components/landing/WhatWeDo";
import { WhyBiz } from "../components/landing/WhyBiz";

// Sections A-J from the restructuring brief, in order.
export function Landing() {
  return (
    <div>
      <Nav />
      <main>
        <Hero />
        <WhatWeDo />
        <WhyBiz />
        <FeaturedServices />
        <PackagesSection />
        <HowItWorks />
        <ForgeSection />
        <FamilySection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <ChatLauncher />
    </div>
  );
}
