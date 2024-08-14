"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import Terminal from "@/components/terminal";

import Image from "next/image";
import Link from "next/link";

export const HeroSection = () => {
  const { theme } = useTheme();
  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <Badge variant="outline" className="text-sm py-2">
            <span className="mr-2 text-primary">
              <Badge>New</Badge>
            </span>
            <span> Version 0.0.17 out now!</span>
          </Badge>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
            <h1>
              Revolutionize UI with
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                Hydra AI
              </span>
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            {`Empower your development with our AI-driven React UI package.`}
          </p>
          <Terminal command="npm i hydra-ai" />
          <div className="space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="https://github.com/MichaelMilstead/hydra-template"
              target="_blank"
            >
              <Button className="w-5/6 md:w-1/4 font-bold group/arrow">
                Use our template
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              asChild
              variant="secondary"
              className="w-5/6 md:w-1/4 font-bold"
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
