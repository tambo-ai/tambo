"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpenIcon, PackageIcon } from "lucide-react";
import Link from "next/link";

const iconMap = {
  BookOpen: BookOpenIcon,
  Package: PackageIcon,
} as const;

// Final CTA content
const finalCtaContent = {
  title: "Ready to get started?",
  description: "Ship an ai assistant with generative ui in minutes.",
  buttons: [
    {
      text: "Get Started",
      icon: "BookOpen",
      link: "/docs",
    },
    {
      text: "Components",
      icon: "Package",
      link: "https://ui.tambo.co",
    },
  ],
};

export function FinalCTA() {
  return (
    <Section id="final-cta" className="py-16 sm:py-24">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-3">
        <motion.div
          className="flex flex-col space-y-4 sm:space-y-6 mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading tracking-tight">
            {finalCtaContent.title}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {finalCtaContent.description}
          </p>
        </motion.div>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-center w-full max-w-md md:max-w-none">
          {finalCtaContent.buttons.map((button, index) => (
            <motion.div
              key={button.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              className="w-full md:w-auto"
            >
              <Link
                href={button.link}
                className={cn(
                  buttonVariants({
                    variant: index === 0 ? "default" : "outline",
                  }),
                  "text-base sm:text-lg flex items-center gap-2 py-4 sm:py-6 px-6 sm:px-8 rounded-md w-full md:w-auto justify-center",
                )}
              >
                {(() => {
                  const Icon = iconMap[button.icon as keyof typeof iconMap];
                  return <Icon className="h-4 w-4 sm:h-5 sm:w-5" />;
                })()}
                {button.text}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
