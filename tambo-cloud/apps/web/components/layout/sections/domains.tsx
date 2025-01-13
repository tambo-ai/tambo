import React, { useState, useRef, useEffect } from "react";
import ChatExample from "@/components/chat-example";
import {
  HSAAccountComponent,
  LeadsComponent,
  CustomerInfoComponent,
  UpgradeMessageComponent,
} from "@/components/example";
import { motion } from "framer-motion";

const ExamplesSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const examples = [
    {
      title: "Streamline User Experience",
      subtitle: "Instantly access features without navigating complex menus.",
      userMessages: ["Increase my monthly HSA contributions"],
      component: <HSAAccountComponent />,
      aiResponseTexts: [
        "I've updated your HSA contributions for the year 2024.",
      ],
    },
    {
      title: "Understand User Jargon",
      subtitle:
        "Let AI interpret user-specific terminology and respond accordingly.",
      userMessages: ["Show me my fu"],
      component: <LeadsComponent />,
      aiResponseTexts: [
        "I understand 'fu' might mean 'follow-ups' in your context. Here are the leads requiring follow-up:",
      ],
    },
    {
      title: "Build more intuitive tools",
      subtitle: "Build products user can use day 1.",
      component: <CustomerInfoComponent />,
      userMessages: ["Customer 123-acme"],
      aiResponseTexts: ["Here's information about a customer with that id."],
    },
    {
      title: "User Generated Workflows",
      subtitle: "Allow users to recombine features to fit their needs.",
      userMessages: ["Send a message"],
      component: (
        <UpgradeMessageComponent
          customer={{
            id: "123-acme",
            name: "Acme Corporation",
            email: "contact@acme.com",
            plan: "Premium Plus",
            subscriptionStatus: "Active",
          }}
        />
      ),
      aiResponseTexts: ["I've generated a message to user you just upgraded."],
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
          examples.length - 1,
        );
        setCurrentIndex(newIndex);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [examples.length]);

  return (
    <div ref={containerRef} className="bg-background text-foreground">
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
                  userMessages={example.userMessages}
                  components={[example.component]}
                  aiResponseTexts={example.aiResponseTexts}
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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  {example.title}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {example.subtitle}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export { ExamplesSection };
