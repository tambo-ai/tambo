"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  BookOpenIcon,
  SmartphoneIcon,
  PackageIcon,
  BookIcon,
} from "lucide-react";
import { AuroraText } from "@/components/aurora-text";
import { copy } from "@/lib/copy";

const iconMap = {
  BookOpen: BookOpenIcon,
  Smartphone: SmartphoneIcon,
  Package: PackageIcon,
  Book: BookIcon,
} as const;

const content = copy.community;

export function Community() {
  return (
    <Section id="developers">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <motion.div
          className="flex flex-col space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <AuroraText>{content.title}</AuroraText>
          </h2>
          <p className="text-lg text-muted-foreground">{content.description}</p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-8 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {content.features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-muted/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                {(() => {
                  const Icon = iconMap[feature.icon as keyof typeof iconMap];
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-medium">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            href={content.cta.link}
            className={cn(
              buttonVariants({ variant: "default" }),
              "text-lg flex items-center gap-2",
            )}
          >
            {(() => {
              const Icon = iconMap[content.cta.icon as keyof typeof iconMap];
              return <Icon className="h-4 w-4" />;
            })()}
            {content.cta.text}
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}
