"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { GithubLogo, ChatGPTLogo, T3Logo, ClaudeLogo } from "./logos";
import Image from "next/image";

interface OpenDropdownProps {
  markdownUrl: string;
  githubUrl: string;
}

type LinkItem = {
  name: string;
  url: string;
  icon: React.ComponentType;
  description: string;
  internal?: boolean;
};

const TamboLogo = () => (
  <Image
    src="/logo/icon/Octo-Icon.svg"
    alt="Tambo"
    width={24}
    height={24}
    className="w-6 h-6"
  />
);

export function OpenDropdown({ markdownUrl, githubUrl }: OpenDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const encodedUrl = encodeURIComponent(markdownUrl);
  const encodedTamboQuery = encodeURIComponent(
    "I want to ask questions about this page.",
  );

  const links: LinkItem[] = [
    {
      name: "GitHub",
      url: githubUrl,
      icon: GithubLogo,
      description: "View source on GitHub",
    },
    {
      name: "tambo",
      url: `${markdownUrl}?q=${encodedTamboQuery}`,
      icon: TamboLogo,
      description: "Ask questions to tambo",
      internal: true,
    },
    {
      name: "ChatGPT",
      url: `https://chatgpt.com/?hints=search&q=Read+${encodedUrl}%2C+I+want+to+ask+questions+about+it.`,
      icon: ChatGPTLogo,
      description: "Ask questions with ChatGPT",
    },
    {
      name: "Claude",
      url: `https://claude.ai/new?q=Read+${encodedUrl}%2C+I+want+to+ask+questions+about+it.`,
      icon: ClaudeLogo,
      description: "Ask questions with Claude",
    },
    {
      name: "T3 Chat",
      url: `https://t3.chat/new?q=Read+${encodedUrl}%2C+I+want+to+ask+questions+about+it.`,
      icon: T3Logo,
      description: "Ask questions with T3 Chat",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-fd-foreground hover:text-fd-foreground transition-colors cursor-pointer border border-fd-border rounded-md hover:bg-fd-muted"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open page in external services"
      >
        Open
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 sm:left-0 top-full mt-1 w-64 sm:w-72 bg-fd-background border border-fd-border rounded-md shadow-lg z-50">
            <div>
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target={link.internal ? undefined : "_blank"}
                    rel={link.internal ? undefined : "noopener noreferrer"}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-fd-foreground hover:bg-neutral-200/70 hover:text-neutral-900 transition-all duration-200 group"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="text-gray-600 group-hover:text-neutral-900 transition-colors duration-200">
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium group-hover:text-neutral-900 transition-colors duration-200">
                        {link.name}
                      </div>
                      <div className="text-xs text-fd-muted-foreground truncate transition-colors duration-200">
                        {link.description}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
