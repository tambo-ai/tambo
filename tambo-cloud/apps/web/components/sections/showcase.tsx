"use client";

import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Easing, motion } from "framer-motion";
import { EyeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

// Showcase content
const showcaseContent = {
  title: "Build with our UI components",
  description:
    "Use our UI components with tambo integrated to get AI apps started in minutes.",
  cta: {
    primary: {
      text: "Explore Components",
      href: "https://ui.tambo.co",
      icon: EyeIcon,
    },
  },
  preview: {
    image: "/assets/landing/drawings/OCTO-TRANSPARENT-8.svg",
    alt: "Tambo Component Showcase",
  },
};

export function Showcase() {
  return (
    <Section id="showcase" className="py-16 sm:py-24">
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
        {/* Preview Image */}
        <motion.div
          className="w-64 sm:w-72 lg:w-80"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <div className="relative aspect-square w-full">
            <Image
              src={showcaseContent.preview.image}
              alt={showcaseContent.preview.alt}
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="flex-1 text-center lg:text-left space-y-4 sm:space-y-6"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
          >
            {showcaseContent.title}
          </motion.h2>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl lg:max-w-none"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
          >
            {showcaseContent.description}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            <Link
              href={showcaseContent.cta.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "text-base flex items-center gap-2 py-3 px-6 rounded-md justify-center hover:scale-105 transition-transform",
              )}
            >
              {(() => {
                const Icon = showcaseContent.cta.primary.icon;
                return <Icon className="h-4 w-4" />;
              })()}
              {showcaseContent.cta.primary.text}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
}
