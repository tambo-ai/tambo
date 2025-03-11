import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BlogCTA() {
  return (
    <Section id="blog-cta">
      <div className="border overflow-hidden relative text-center py-8 md:py-10 mx-auto rounded-lg bg-background/50 dark:bg-background/80">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="font-heading text-xl md:text-2xl font-medium mb-3 text-foreground">
            Build with Tambo
          </h3>
          <p className="text-muted-foreground mb-4 mx-auto">
            Tambo is a developer tool for building adaptive user experiences
            with AI.
          </p>

          <div className="flex justify-center">
            <Button className="shadow-sm" variant="accent" asChild>
              <Link href="/">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
