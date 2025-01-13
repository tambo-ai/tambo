# Landing Page Notes

## Removed Components

Brief overview of components commented out in `app/page.tsx`:

- `<Logos />` - Partner/client brand showcase
- `<UseCases />` - Product application examples
- `<Features />` - Core product capabilities
- `<Statistics />` - Key metrics and numbers
- `<Testimonials />` - Customer reviews
- `<Pricing />` - Product pricing plans
- `<Blog />` - Recent articles/posts

To restore: Remove comment tags (`{/* */}`) in page.tsx

```tsx
import { Blog } from "@/components/sections/blog";
import { Community } from "@/components/sections/community";
import { CTA } from "@/components/sections/cta";
import { Examples } from "@/components/sections/examples";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { Logos } from "@/components/sections/logos";
import { Pricing } from "@/components/sections/pricing";
import { Statistics } from "@/components/sections/statistics";
import { Testimonials } from "@/components/sections/testimonials";
import { UseCases } from "@/components/sections/use-cases";
import { Demo } from "@/components/sections/demo";
export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Demo />
      {/* <Logos /> */}
      <Examples />
      {/* <UseCases />
      <Features /> */}
      {/* <Statistics /> */}
      {/* <Testimonials /> */}
      {/* <Pricing /> */}
      <Community />
      {/* <Blog /> */}
      <CTA />
      <Footer />
    </main>
  );
}
```

## Other

- moved old landing page to `/old`
