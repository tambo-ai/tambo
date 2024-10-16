"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Terminal from "@/components/terminal";
import { track } from "@vercel/analytics";
import { TypeAnimation } from "react-type-animation";

import Link from "next/link";

export const HeroSection = () => {
  const { theme } = useTheme();

  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <Link
            href="https://www.npmjs.com/package/hydra-ai"
            className="inline-block"
          >
            <Button variant="outline" className="text-sm py-2">
              <span className="mr-2 text-primary">
                <Badge>New</Badge>
              </span>
              <span>Version 0.0.38 out now!</span>
            </Button>
          </Link>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
            <h1>
              Install{" "}
              <TypeAnimation
                sequence={["adaptive", 3000, "smart", 3000, "contextual", 3000]}
                wrapper="span"
                speed={1}
                repeat={Infinity}
              />
              UI
              <br />
              with hydra-ai
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            {`Improve your UX with AI-driven React components.`}
          </p>
          <div className="w-[500px] mx-auto">
            <Terminal command="npm i hydra-ai" />
          </div>
          <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
            <Link
              href="https://discord.gg/dJNvPEHth6"
              target="_blank"
              onClick={() => track("Discord Join Clicked")}
              className="w-full md:w-48"
            >
              <Button className="w-full font-bold group/arrow">
                Join our Discord
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              asChild
              variant="secondary"
              className="w-full md:w-48 font-bold"
              onClick={() => track("View Github")}
            >
              <Link
                href="https://github.com/michaelmagan/hydraai"
                target="_blank"
              >
                Check out our Github
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
