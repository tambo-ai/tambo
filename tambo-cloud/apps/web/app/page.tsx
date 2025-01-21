import { AnalyticsSection } from "@/components/sections/analytics-section";
import { ControlBarSection } from "@/components/sections/control-bar-section";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Header } from "@/components/sections/header";
import { Community } from "@/components/sections/community";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl">
          <Hero />
          <AnalyticsSection />
          <ControlBarSection />
          <Features />
          <Community />
          <Footer />
        </div>
      </div>
    </main>
  );
}
