"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Terminal from "@/components/terminal";
import { track } from "@vercel/analytics";
import { TypeAnimation } from "react-type-animation";
import Link from "next/link";
import GithubIcon from "@/components/icons/github-icon";

export const HeroSection = () => {
  const { theme } = useTheme();

  const buildExamples = [
    "AI-Powered CRM",
    "AI Support Manager",
    "Legal Co-pilot",
    "Healthcare AI Assistant",
    "Supply Chain Co-pilot",
    "AI Financial Analyst",
    "AI-Powered Recruiter",
    "Customer Success Co-pilot",
    "AI-Powered Project Manager",
    "AI Tutor",
  ];

  return (
    <section className="container w-full px-4 sm:px-6 lg:px-8">
      <div className="grid place-items-center gap-8 mx-auto py-auto mt-10">
        <div className="text-center space-y-8 sm:space-y-10 mt-10">
          <Link
            href="https://www.npmjs.com/package/hydra-ai"
            className="inline-block"
          >
            <Button
              variant="outline"
              className="text-xs sm:text-sm py-1 sm:py-2"
            >
              <span className="mr-2 text-primary">
                <Badge>New</Badge>
              </span>
              <span>Version 0.0.38 out now!</span>
            </Button>
          </Link>

          <div className="relative max-w-screen-md mx-auto text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl"></div>
            <h1 className="relative z-10 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Build{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                Adaptive
              </span>{" "}
              UIs with AI
            </h1>
            <p className="relative z-10 text-xl sm:text-2xl font-semibold text-muted-foreground">
              AI-powered router surfaces the right features to users based on
              context
            </p>
          </div>

          <div className="w-full sm:w-[400px] md:w-[500px] mx-auto mt-12">
            <Terminal command="npm i hydra-ai" />
          </div>
          <div className="w-full sm:w-[400px] md:w-[500px] mx-auto flex flex-col items-center justify-center">
            <p className="text-xl sm:text-2xl font-semibold text-center mb-4">
              What will you build?
            </p>
            <div className="h-[2em] flex items-center">
              <span className="font-bold text-blue-500 text-2xl sm:text-3xl ">
                <TypeAnimation
                  sequence={[
                    buildExamples[0],
                    2000,
                    buildExamples[1],
                    2000,
                    buildExamples[2],
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  preRenderFirstString={true}
                />
              </span>
            </div>
          </div>
          <div className="flex flex-row space-y-0 space-x-4 justify-center">
            <Link
              href="https://discord.gg/dJNvPEHth6"
              target="_blank"
              onClick={() => track("Discord Join Clicked")}
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto font-bold group/arrow">
                Talk to Us
                <ArrowRight className="size-4 sm:size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              asChild
              variant="secondary"
              className="w-full sm:w-auto font-bold"
              onClick={() => track("View Github")}
            >
              <Link
                href="https://github.com/michaelmagan/hydraai"
                target="_blank"
                className="flex items-center"
              >
                <div className="mr-2">
                  <GithubIcon />
                </div>
                Our Github
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
