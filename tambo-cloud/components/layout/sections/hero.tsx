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
    <section className="container w-full px-4 sm:px-6 lg:px-8">
      <div className="grid place-items-center gap-8 mx-auto py-auto mt-10">
        <div className="text-center space-y-6 sm:space-y-8">
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

          <div className="max-w-screen-md mx-auto text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
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
              <span className="sm:ml-2">with hydra-ai</span>
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-base sm:text-lg md:text-xl text-muted-foreground">
            {`Improve your UX with AI-driven React components.`}
          </p>
          <div className="w-full sm:w-[400px] md:w-[500px] mx-auto">
            <Terminal command="npm i hydra-ai" />
          </div>
          <div className="space-y-4 flex flex-col sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              href="https://discord.gg/dJNvPEHth6"
              target="_blank"
              onClick={() => track("Discord Join Clicked")}
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto font-bold group/arrow">
                Join our Discord
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
