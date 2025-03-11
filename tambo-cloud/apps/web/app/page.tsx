import { AnalyticsSection } from "@/components/sections/analytics-section";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Hero />
          <AnalyticsSection />
          {/* <Statistics /> */}
          {/* <Testimonials /> */}
          <Features />
          <FinalCTA />
          <Footer />
        </div>
      </div>
    </main>
  );
}
