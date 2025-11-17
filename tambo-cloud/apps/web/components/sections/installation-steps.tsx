"use client";

import { CLI } from "@/components/cli";
import { Easing, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type TabType = "template" | "existing";

const cliItems = [
  {
    id: "template",
    label: "Start with a Template",
    command: "npm create tambo-app my-app",
  },
  {
    id: "existing",
    label: "Add to Existing App",
    command: "npx tambo full-send",
  },
];

export function InstallationSteps() {
  const [activeTab, setActiveTab] = useState<TabType>("template");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
      },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const oldSectionRef = sectionRef.current;
    return () => {
      if (oldSectionRef) {
        observer.unobserve(oldSectionRef);
      }
    };
  }, []);

  const ease: Easing = [0.16, 1, 0.3, 1];

  const handleTabChange = (id: string) => {
    setActiveTab(id as TabType);
  };

  return (
    <section className="py-24" ref={sectionRef}>
      <div className="max-w-2xl mx-auto">
        <div className="space-y-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, ease }}
            className="w-full"
          >
            <CLI
              items={cliItems}
              theme="light"
              defaultActiveItemId={activeTab}
              className="group mb-4"
              onItemChange={handleTabChange}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            <a
              href={`${process.env.NEXT_PUBLIC_DOCS_URL || "/docs"}/getting-started/quickstart${
                activeTab === "template" ? "#template" : "#existing-app"
              }`}
              className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/80 text-black rounded-lg font-sans text-sm font-medium transition-colors"
            >
              view full installation guide
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
