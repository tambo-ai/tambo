"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpenIcon, CalendarIcon } from "lucide-react";
import Link from "next/link";

const iconMap = {
  BookOpen: BookOpenIcon,
  Calendar: CalendarIcon,
} as const;

// Final CTA content
const finalCtaContent = {
  title: "Ready to get started?",
  description:
    "Check out our docs and if you get stuck, book a meeting with us.",
  buttons: [
    {
      text: "Docs",
      icon: "BookOpen",
      link: "/docs",
    },
    {
      text: "Meet us",
      icon: "Calendar",
      link: "https://cal.com/michaelmagan/chat?duration=30",
    },
  ],
};

export function FinalCTA() {
  return (
    <Section id="final-cta" className="py-16 sm:py-24">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <motion.div
          className="flex flex-col space-y-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-heading tracking-tight sm:text-5xl md:text-6xl">
            {finalCtaContent.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {finalCtaContent.description}
          </p>
        </motion.div>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          {finalCtaContent.buttons.map((button, index) => (
            <motion.div
              key={button.text}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
            >
              <Link
                href={button.link}
                className={cn(
                  buttonVariants({
                    variant: index === 0 ? "default" : "outline",
                  }),
                  "text-lg flex items-center gap-2 py-6 px-8 rounded-md",
                )}
              >
                {(() => {
                  const Icon = iconMap[button.icon as keyof typeof iconMap];
                  return <Icon className="h-5 w-5" />;
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
