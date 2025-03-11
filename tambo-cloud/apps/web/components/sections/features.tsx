"use client";

import { Section } from "@/components/section";

// Move copy directly into the component
const featuresContent = {
  heading: "Features",
  description:
    "A batteries included React package for adding intelligence into your app.",
  list: [
    {
      // octo-running
      title: "Streaming",
      description:
        "We support streaming of every AI generated bit of your UI, including react components, with helpful hooks to improve the UX.",
    },
    {
      // octo-filing
      title: "Message Thread History",
      description:
        "We automagically store message history. So you can focus on the functionality, while we focus on the rest.",
    },
    {
      // octo-directing
      title: "State Management",
      description:
        "We give you an AI integrated state hook that keeps track of user inputs, and passes them to the AI.",
    },
    {
      // octo-guiding
      title: "Suggested Actions",
      description:
        "Turn your AI assistant into a guide through the functionality of your app.",
    },
    {
      // octo-multi-tasking
      title: "Decision Loop",
      description:
        "We handle AI orchestration so you can focus on adding the functionality.",
    },
    {
      // octo-painting
      title: "Component Library",
      description:
        "Need components to setup your AI, we have them for you in one CLI command.",
    },
  ],
};

export function Features() {
  return (
    <Section id="features" className="container py-16 sm:py-24">
      <div className="mb-8 sm:mb-16 text-center sm:text-left">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading mb-4 sm:mb-8 tracking-tight">
          {featuresContent.heading}
        </h2>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl mx-auto sm:mx-0">
          {featuresContent.description}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
        {featuresContent.list.map(({ title, description }, index) => (
          <div key={title} className="feature-item flex flex-col items-center">
            {/* TODO: Add image back later */}

            <div className="text-center sm:text-left w-full">
              <h3 className="text-xl font-heading mb-2">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
