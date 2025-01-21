"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  MessageSquareTextIcon,
  GraduationCapIcon,
  LineChartIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { AuroraText } from "@/components/aurora-text";
import HeroVideoDialog from "@/components/ui/hero-video-dialog";
import { copy } from "@/lib/copy";

const iconMap = {
  MessageSquareText: MessageSquareTextIcon,
  GraduationCap: GraduationCapIcon,
  LineChart: LineChartIcon,
} as const;

const content = copy.analytics;

export function AnalyticsSection() {
  return (
    <Section id="analytics">
      <div className="flex flex-col items-center text-center lg:text-left lg:items-start max-w-3xl mx-auto lg:max-w-none lg:grid lg:grid-cols-2 gap-16">
        <div className="flex flex-col space-y-8 order-2 lg:order-1">
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
            <p className="text-lg text-muted-foreground">
              {content.description}
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {content.features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col lg:flex-row items-center lg:items-start gap-4 text-center lg:text-left"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {(() => {
                    const Icon = iconMap[feature.icon as keyof typeof iconMap];
                    return <Icon className="h-6 w-6 text-primary" />;
                  })()}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="flex flex-col space-y-4 w-full order-1 lg:order-2">
          <div className="aspect-video w-full rounded-lg">
            <HeroVideoDialog
              videoSrc={content.demo.videoSrc}
              className="w-full shadow-2xl rounded-3xl border border-border"
            />
          </div>
          <div className="flex justify-center">
            <Link
              href={content.cta.link}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "flex gap-2 bg-accent hover:bg-accent/90",
              )}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              {content.cta.buttonText}
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
