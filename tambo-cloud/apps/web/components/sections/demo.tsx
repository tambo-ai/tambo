"use client";

import { Section } from "@/components/section";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";

export function Demo() {
  return (
    <Section id="demo" title="See it in action">
      <div className="border overflow-hidden relative p-20 md:p-32">
        <div className="relative">
          <HeroVideoDialog
            className="dark:hidden block"
            animationStyle="from-center"
            videoSrc="/videos/yage-demo.mp4"
          />
          <HeroVideoDialog
            className="hidden dark:block"
            animationStyle="from-center"
            videoSrc="/videos/yage-demo.mp4"
          />
        </div>
      </div>
    </Section>
  );
}
