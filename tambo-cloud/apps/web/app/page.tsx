import { CodeExamples } from "@/components/sections/code-examples";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { InstallationSteps } from "@/components/sections/installation-steps";
import { Showcase } from "@/components/sections/showcase";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header className="px-4 sm:px-6 lg:px-8" />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <Hero />
          {/* <InteractiveDemo /> */}
          <CodeExamples />
          <InstallationSteps />
          {/* <Statistics /> */}
          {/* <Testimonials /> */}
          <Features />
          <Showcase />
          <FinalCTA />
          <Footer />
        </div>
      </div>
    </main>
  );
}
