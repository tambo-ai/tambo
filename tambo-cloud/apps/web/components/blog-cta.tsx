import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BlogCTA() {
  return (
    <Section id="blog-cta">
      <div className="border overflow-hidden relative text-center py-16 mx-auto">
        <p className="max-w-3xl text-foreground mb-6 text-balance mx-auto font-medium text-xl">
          Hydra AI is a developer tool for building adaptive user experiences
          with AI.
        </p>

        <div className="flex justify-center">
          <Button className="flex items-center gap-2" asChild>
            <Link href="/">Learn more</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
