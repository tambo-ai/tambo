"use client";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

export function Testimonials() {
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 9;

  return (
    <Section id="testimonials" title="Testimonials">
      <div className="border-t">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-0 lg:bg-grid-3 border-r pb-24 sm:bg-grid-2 relative bg-grid-1">
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-2/6 w-[calc(100%-2px)] overflow-hidden bg-gradient-to-t from-background to-transparent"></div>

          <Button
            variant="outline"
            className="absolute bottom-12 left-1/2 -translate-x-1/2 border h-10 w-fit px-5 flex items-center justify-center z-10"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "See more"}
          </Button>

          {siteConfig.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={cn(
                "flex flex-col border-b break-inside-avoid border-l",
                "transition-colors hover:bg-secondary/20",
                !showAll && index >= initialDisplayCount && "hidden"
              )}
            >
              <div className="px-4 py-5 sm:p-6 flex-grow">
                <div className="flex items-center gap-4 mb-4">
                  {testimonial.image && (
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                <p>{testimonial.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
