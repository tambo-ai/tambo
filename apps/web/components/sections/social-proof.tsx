"use client";

import { Icons } from "@/components/icons";
import { Section } from "@/components/section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Tweet {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
}

const socialProofTweets: Tweet[] = [
  {
    id: "1",
    user: {
      name: "Paul Copplestone",
      username: "kiwicopple",
      avatar: "/assets/landing/avatars/@kiwicopple.png",
    },
    content: "this is 🔥",
  },
  {
    id: "2",
    user: {
      name: "Thor 雷神 ⚡️",
      username: "thorwebdev",
      avatar: "/assets/landing/avatars/@thorwebdev.png",
    },
    content:
      "This is super cool 🤩 Streaming hyper personalised UI components into your app with @tambo_ai and @supabase MCP server!",
  },
  {
    id: "3",
    user: {
      name: "Iza",
      username: "izadoesdev",
      avatar: "/assets/landing/avatars/@izadoesdev.png",
    },
    content: "@tambo_ai this is for you <3",
  },
  {
    id: "4",
    user: {
      name: "Seyam Alam",
      username: "SeyamAlam1",
      avatar: "/assets/landing/avatars/@SeyamAlam1.png",
    },
    content:
      "Thanks. Though wish I'd known about @tambo_ai sooner. Would have saved me at least a hundred hours in a separate project.",
  },
  {
    id: "5",
    user: {
      name: "the editor company",
      username: "editorcompany",
      avatar: "/assets/landing/avatars/@editorcompany.png",
    },
    content: "this is sick.",
  },
];

function renderTweetContent(content: string) {
  // Replace @tambo_ai with clickable link
  const parts = content.split(/(@tambo_ai)/);

  return parts.map((part, index) => {
    if (part === "@tambo_ai") {
      return (
        <a
          key={index}
          href="https://x.com/tambo_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          @tambo_ai
        </a>
      );
    }
    return part;
  });
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[400px] max-w-[400px]"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={tweet.user.avatar} alt={tweet.user.name} />
          <AvatarFallback>
            {tweet.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {tweet.user.name}
            </h4>
            <span className="text-gray-500 text-sm">
              @{tweet.user.username}
            </span>
          </div>

          <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
            {renderTweetContent(tweet.content)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ScrollingTweets({ tweets }: { tweets: Tweet[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const scrollWidth = scrollElement.scrollWidth;
    const clientWidth = scrollElement.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    const scrollSpeed = 0.5;
    let animationId: number;

    const scroll = () => {
      if (!isHovered) {
        scrollPositionRef.current += scrollSpeed;
        if (scrollPositionRef.current >= maxScroll) {
          scrollPositionRef.current = 0;
        }
        scrollElement.scrollLeft = scrollPositionRef.current;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  return (
    <div
      ref={scrollRef}
      className="flex space-x-6 overflow-x-hidden scrollbar-hide py-2"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {[...tweets, ...tweets].map((tweet, index) => (
        <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
      ))}
    </div>
  );
}

export function SocialProof() {
  return (
    <Section id="social-proof" className="py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative mb-8 sm:mb-12"
      >
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10"></div>

        <ScrollingTweets tweets={socialProofTweets} />
      </motion.div>

      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      ></motion.div>

      <motion.div
        className="flex flex-col md:flex-row gap-4 justify-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <a
          href="https://discord.gg/dJNvPEHth6"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "text-base sm:text-lg flex items-center gap-2 py-4 sm:py-6 px-6 sm:px-8 rounded-md",
          )}
        >
          <Icons.discord className="h-4 w-4 sm:h-5 sm:w-5" />
          Join our Discord
        </a>
        <a
          href="https://github.com/tambo-ai/tambo"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "text-base sm:text-lg flex items-center gap-2 py-4 sm:py-6 px-6 sm:px-8 rounded-md",
          )}
        >
          <Icons.github className="h-4 w-4 sm:h-5 sm:w-5" />
          Star our repo
        </a>
      </motion.div>
    </Section>
  );
}
