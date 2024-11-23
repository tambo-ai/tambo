import { Community } from "@/components/sections/community";
import { CTA } from "@/components/sections/cta";
import { Examples } from "@/components/sections/examples";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Demo } from "@/components/sections/demo";
import { Header } from "@/components/sections/header";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Demo />
      <Examples />
      <Community />
      <CTA />
      <Footer />
    </main>
  );
}
