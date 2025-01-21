"use client";

import { Section } from "@/components/section";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";

export function Demo() {
  return (
    <Section id="demo" title="See it in action">
      <div className="border overflow-hidden relative p-20 md:p-32">
        <div className="relative">
          <HeroVideoDialog
            videoSrc="/videos/yage-demo.mp4"
            darkModeVideoSrc="/videos/yage-demo.mp4"
            animationStyle="from-center"
            theme="system"
            className="w-full"
          />
        </div>
      </div>
    </Section>
  );
}
