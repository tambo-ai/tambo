"use client";

import { Section } from "@/components/section";
import { Easing, motion } from "framer-motion";
import Image from "next/image";

// Move copy directly into the component
const featuresContent = {
  heading: "Features",
  description:
    "A batteries-included React package for adding intelligence into your app.",
  list: [
    {
      // octo-running
      title: "Streaming",
      description:
        "We support streaming of every AI generated bit of your UI, including react components, with helpful hooks to improve the UX.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-2.svg",
    },
    {
      // octo-filing
      title: "Message Thread History",
      description:
        "We automagically store message history. You can focus on functionality, while we take care of the rest.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-1.svg",
    },
    {
      // octo-directing
      title: "State Management",
      description:
        "We give you an AI integrated state hook that keeps track of user inputs, and passes them to the AI.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-5.svg",
    },
    {
      // octo-guiding
      title: "Suggested Actions",
      description:
        "Turn your AI assistant into a guide through the functionality of your app.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-4.svg",
    },
    {
      // octo-multi-tasking
      title: "Tool Calling",
      description:
        "Register custom tools and functions that your AI can intelligently call to perform actions and retrieve data.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-9.svg",
    },
    {
      // octo-painting
      title: "Authentication",
      description:
        "Built-in authentication system that handles user sessions and secure access to your AI features.",
      image: "/assets/landing/drawings/OCTO-TRANSPARENT-3.svg",
    },
  ],
};

// Animation configuration
const ease: Easing = [0.16, 1, 0.3, 1];

export function Features() {
  return (
    <Section id="features" className="py-16 sm:py-24">
      <motion.div
        className="mb-8 sm:mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading mb-4 sm:mb-8 tracking-tight">
          {featuresContent.heading}
        </h2>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto">
          {featuresContent.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {featuresContent.list.map(({ title, description, image }, index) => (
          <motion.div
            key={title}
            className="feature-item flex flex-col items-center p-3 sm:p-4 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 * index, ease }}
          >
            <motion.div
              className="mb-2 h-24 w-24 sm:h-32 sm:w-32 relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={image}
                alt={title}
                fill
                className="object-contain"
                priority={index < 3}
              />
            </motion.div>

            <motion.div
              className="text-center w-full"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 + 0.1 * index, ease }}
            >
              <h3 className="text-lg sm:text-xl font-heading mb-2">{title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {description}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
