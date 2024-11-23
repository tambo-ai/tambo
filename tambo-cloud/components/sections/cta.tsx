import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export function CTA() {
  return (
    <Section id="cta">
      <div className="border overflow-hidden relative text-center py-16 mx-auto">
        <p className="max-w-3xl text-foreground mb-6 text-balance mx-auto font-medium text-3xl">
          Ready to build the future of UX?
        </p>

        <div className="flex justify-center">
          <Button className="flex items-center gap-2" asChild>
            <Link href="/docs">Get Started</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
