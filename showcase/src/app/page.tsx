"use client";

import { useState } from "react";
import { SecondNavbar } from "@/components/second-navbar";
import { TabContent } from "@/components/tab-content";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Examples");

  return (
    <div className="flex flex-col items-center gap-8 p-4 -mt-10">
      <div className="w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center gap-8 py-24 -mb-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-2xl opacity-50" />
            <p className="relative bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium inline-block">
              AI Components
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 relative">
            <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Add AI capabilities to <br /> your application in minutes
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              A collection of ready-to-use AI components that help you build
              intelligent features without the complexity.
            </p>
          </div>

          <div className="flex gap-4 mt-2">
            <Link
              href="/components"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="border border-border hover:bg-primary/5 px-6 py-3 rounded-lg font-medium transition-all"
            >
              Documentation
            </Link>
          </div>
        </div>

        <SecondNavbar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="w-full mt-10">
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
