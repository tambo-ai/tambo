import { TabbedSection } from "@/components/tabbed-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambo AI - UI Components",
  description: "Tambo AI",
};

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 p-4 -mt-10">
      <div className="w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center gap-8 py-24 -mb-10">
          <div className="flex flex-col items-center gap-6 relative">
            <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Components to quickstart your AI app development
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              A collection of ready-to-use AI components hooked up to Tambo AI.
            </p>
          </div>
        </div>

        <TabbedSection />
      </div>
    </div>
  );
}
