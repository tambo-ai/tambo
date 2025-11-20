"use client";

import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { Easing, motion } from "framer-motion";
import Link from "next/link";

// Animation ease curve matching Hero component
const ease: Easing = [0.16, 1, 0.3, 1];

const stats = [
  {
    title: "160+",
    subtitle: "Stars on GitHub",
    icon: <Icons.github className="h-5 w-5" />,
    href: "https://github.com/tambo-ai",
  },
  {
    title: "165+",
    subtitle: "Discord Members",
    icon: <Icons.discord className="h-5 w-5" />,
    href: "https://discord.gg/tambo-ai",
  },
  {
    title: "5K+",
    subtitle: "Downloads",
    icon: <Icons.npm className="h-5 w-5" />,
    href: "https://www.npmjs.com/package/tambo-ai",
  },
];

export function Statistics() {
  return (
    <Section id="statistics">
      <motion.div
        className="border-x border-t rounded-t-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease }}
        style={{
          backgroundImage:
            "radial-gradient(circle at bottom center, hsl(var(--accent) / 0.4), hsl(var(--background)))",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.4 + idx * 0.1,
                duration: 0.8,
                ease,
              }}
            >
              <Link
                href={stat.href}
                className="flex flex-col items-center justify-center py-8 px-4 border-b sm:border-b-0 last:border-b-0 sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(-n+3)]:border-t-0 relative group overflow-hidden h-full"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-full -translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 duration-300 ease-in-out">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <div className="text-center relative icon-container">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="float-animation"
                  >
                    <h3 className="text-4xl sm:text-5xl font-heading tracking-tighter">
                      {stat.title}
                    </h3>
                  </motion.div>
                  <motion.div
                    className="flex items-center justify-center gap-2 mt-3"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="pulse-animation p-1 rounded-full bg-primary/10">
                      {stat.icon}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
