import { BenefitsSection } from "@/components/layout/sections/benefits";
import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { PricingSection } from "@/components/layout/sections/pricing";
import { ServicesSection } from "@/components/layout/sections/services";
import { SponsorsSection } from "@/components/layout/sections/sponsors";
import { TeamSection } from "@/components/layout/sections/team";
import { TestimonialSection } from "@/components/layout/sections/testimonial";
import { HowItWorksSection } from "@/components/layout/sections/howitworks";
import { DiscordSection } from "@/components/layout/sections/discord";
import { DemoSection } from "@/components/layout/sections/demo";

export default function Home() {
  return (
    <>
      <HeroSection />
      <DemoSection />
      <HowItWorksSection />
      {/* <SponsorsSection /> */}
      {/* <BenefitsSection /> */}
      {/* <FeaturesSection /> */}
      {/* <ServicesSection /> */}

      {/* <TestimonialSection /> */}
      <TeamSection />
      {/* <PricingSection /> */}
      {/* <FAQSection /> */}
      <DiscordSection />
      {/* <FooterSection /> */}
    </>
  );
}
