"use client";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Easing, motion } from "framer-motion";
import { ExternalLink, Heart } from "lucide-react";
import Link from "next/link";

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

export function MCP() {
  return (
    <Section id="mcp" className="py-16 sm:py-24">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          className="space-y-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <span className="text-4xl font-heading">MCP? We do too.</span>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Check out our MCP (Model Context Protocol) support for seamless
            integration with your AI models and tools.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <Button asChild size="lg" className="font-medium">
            <Link href="/mcp" className="flex items-center gap-2">
              Learn More
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </Section>
  );
}
