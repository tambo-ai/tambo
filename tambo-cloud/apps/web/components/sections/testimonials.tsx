"use client";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";

// Testimonial data moved in-house
const testimonials = [
  {
    id: 1,
    text: "tambo ai has revolutionized how we build user interfaces. The AI-powered generation is incredibly intuitive.",
    name: "Alice Johnson",
    company: "OpenMind Labs",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 2,
    text: "We've significantly reduced development time using tambo ai. The rapid prototyping feature is a game-changer.",
    name: "Bob Brown",
    company: "NeuralForge",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 3,
    text: "The seamless integration allowed us to incorporate tambo ai into our existing React projects effortlessly.",
    name: "Charlie Davis",
    company: "CodeHarbor",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 4,
    text: "The customizable styling options have allowed us to maintain our brand identity while leveraging AI-generated components.",
    name: "Diana Evans",
    company: "VisualSphere",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 5,
    text: "The code generation feature produces clean, maintainable React code that's easy to customize and extend.",
    name: "Ethan Foster",
    company: "CodeCraft Solutions",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 6,
    text: "The intelligent suggestions have helped us optimize our UI based on best practices and user interaction patterns.",
    name: "Fiona Garcia",
    company: "UX Innovate",
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 7,
    text: "tambo ai's ability to adapt to our project's design system has been invaluable for maintaining consistency across our application.",
    name: "George Harris",
    company: "DesignFlow",
    image:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 8,
    text: "The AI-powered UI generation has allowed our designers and developers to collaborate more effectively.",
    name: "Hannah Irwin",
    company: "CollabTech",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 9,
    text: "We've been able to iterate on our UI components much faster with tambo ai's rapid prototyping capabilities.",
    name: "Ian Jackson",
    company: "AgileWorks",
    image:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTB8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 10,
    text: "The integration with our existing React projects was smooth and the documentation was comprehensive.",
    name: "Julia Kim",
    company: "DevIntegrate",
    image:
      "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDh8fHBvcnRyYWl0fGVufDB8fDB8fHww",
  },
  {
    id: 11,
    text: "tambo ai has helped us reduce our development costs while improving the quality of our user interfaces.",
    name: "Kevin Lee",
    company: "EfficientDev",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHBvcnRyYWl0JTIwbWFufGVufDB8fDB8fHww",
  },
  {
    id: 12,
    text: "The AI assistance has been like having an extra team member who specializes in UI development.",
    name: "Laura Martinez",
    company: "TeamAugment",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fHBvcnRyYWl0JTIwd29tYW58ZW58MHx8MHx8fDA%3D",
  },
];

type TestimonialsProps = {
  count?: number;
};

export function Testimonials({ count = 3 }: TestimonialsProps) {
  // Get the testimonials to display based on count
  const displayedTestimonials = testimonials.slice(0, count);

  // Get additional testimonials for the fade effect
  const mobilePartialTestimonial = testimonials[count];
  const desktopPartialTestimonials = testimonials.slice(count, count + 3);

  return (
    <Section id="testimonials">
      <div className="mb-12">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          What Our Users Say
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Join thousands of developers who are already building amazing
          experiences with tambo ai.
        </p>
      </div>
      <div className="border-t">
        <div className="relative">
          {/* Main testimonials grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-r">
            {displayedTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={cn(
                  "flex flex-col border-b break-inside-avoid border-l",
                  "transition-colors hover:bg-secondary/20",
                )}
              >
                <div className="px-4 py-5 sm:p-6 flex-grow">
                  <div className="flex items-center gap-4 mb-4">
                    {testimonial.image && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
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

          {/* Mobile partial testimonial (only visible on mobile) */}
          {mobilePartialTestimonial && (
            <div className="block sm:hidden relative border-r border-l">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10"></div>
              <div className="flex flex-col border-b overflow-hidden">
                <div className="px-4 py-5 flex-grow">
                  <div className="flex items-center gap-4 mb-4">
                    {mobilePartialTestimonial.image && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={mobilePartialTestimonial.image}
                          alt={mobilePartialTestimonial.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-foreground">
                        {mobilePartialTestimonial.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {mobilePartialTestimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <p className="line-clamp-2">
                      {mobilePartialTestimonial.text}
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop partial testimonials (only visible on desktop) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-r relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10"></div>
            {desktopPartialTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex flex-col border-b border-l overflow-hidden"
              >
                <div className="px-4 py-5 sm:p-6 flex-grow">
                  <div className="flex items-center gap-4 mb-4">
                    {testimonial.image && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
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
                  <div className="relative">
                    <p className="line-clamp-2">{testimonial.text}</p>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href="https://discord.gg/dJNvPEHth6"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="default" className="px-6">
              Join our Discord
            </Button>
          </a>
        </div>
      </div>
    </Section>
  );
}
