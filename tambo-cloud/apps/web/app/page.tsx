import { ComponentLibraryDemo } from "@/components/sections/component-library-demo";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { MCP } from "@/components/sections/mcp";
import { Pricing } from "@/components/sections/pricing";
import { SocialProof } from "@/components/sections/social-proof";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header className="px-4 sm:px-6 lg:px-8" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <Hero />
          <ComponentLibraryDemo />
          <SocialProof />
          {/* <CodeExamples /> */}
          {/* <InstallationSteps /> */}
          {/* <Statistics /> */}
          {/* <Testimonials /> */}
          <Features />
          <MCP />

          <Pricing />
          <FinalCTA />
          <Footer />
        </div>
      </main>
    </div>
  );
}
