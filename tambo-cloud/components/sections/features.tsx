import { Section } from "@/components/section";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Features() {
  const services = siteConfig.features;
  return (
    <Section id="features" title="Features">
      <div className="border-x border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ name, description, icon: Icon }, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-y-2 items-center justify-center py-8 px-4 border-b transition-colors hover:bg-secondary/20",
                "last:border-b-0",
                "md:[&:nth-child(2n+1)]:border-r md:[&:nth-child(n+5)]:border-b-0",
                "lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(n+4)]:border-b-0 lg:border-r"
              )}
            >
              <div className="flex flex-col gap-y-2 items-center">
                <div className="bg-gradient-to-b from-primary to-primary/80 p-2 rounded-lg text-white transition-colors group-hover:from-secondary group-hover:to-secondary/80">
                  {Icon}
                </div>
                <h2 className="text-xl font-medium text-card-foreground text-center text-balance">
                  {name}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground text-balance text-center max-w-md mx-auto">
                {description}
              </p>
              <Link
                href="#"
                className="text-sm text-primary hover:underline underline-offset-4 transition-colors hover:text-secondary-foreground"
              >
                Learn more &gt;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
