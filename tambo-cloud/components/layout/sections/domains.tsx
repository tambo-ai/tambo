import React, { useState, useRef, useEffect } from "react";
import ChatExample from "@/components/chat-example";
import {
  HSAAccountComponent,
  LeadsComponent,
  CustomerInfoComponent,
} from "@/components/example";
import { motion } from "framer-motion";

const ExamplesSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const examples = [
    {
      title: "Users find what they need fast",
      subtitle: "No more clicking around to find the feature they need.",
      userMessage: "double my monthly contributions.",
      component: <HSAAccountComponent />,
      aiResponseText: "I've doubled your contributions for the year 2024. ",
    },
    {
      title: "Guide users to their next action",
      subtitle: "Have AI create better workflows.",
      userMessage: "What should I do next",
      component: <LeadsComponent />,
      aiResponseText: "Here are leads marked with follow up:",
    },
    {
      title: "Build more intuitive tools",
      subtitle: "Build products user can use from day 1.",
      component: <CustomerInfoComponent />,
      userMessage: "Customer 123-acme",
      aiResponseText: "Here's information about a customer with that id.",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      if (rect.top <= 0 && rect.bottom >= sectionHeight) {
        const scrollProgress =
          Math.abs(rect.top) / (sectionHeight - windowHeight);
        const newIndex = Math.min(
          Math.floor(scrollProgress * examples.length),
          examples.length - 1
        );
        setCurrentIndex(newIndex);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [examples.length]);

  return (
    <div ref={containerRef}>
      {examples.map((example, index) => (
        <section
          key={index}
          className="min-h-screen flex flex-col items-center justify-center px-4 md:px-0"
        >
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
              <motion.div
                className={`w-full md:w-1/2 ${
                  index % 2 === 0 ? "order-2 md:order-1" : "order-2"
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ChatExample
                  userMessage={example.userMessage}
                  component={example.component}
                  aiResponseText={example.aiResponseText}
                />
              </motion.div>
              <motion.div
                className={`w-full md:w-1/2 ${
                  index % 2 === 0 ? "order-1 md:order-2" : "order-1"
                } text-center md:text-left`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {example.title}
                </h2>
                <p className="text-lg text-gray-600">{example.subtitle}</p>
              </motion.div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export { ExamplesSection };
