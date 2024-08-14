"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const DiscordSection = () => {
  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center space-y-8">
          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold">
            <h2>
              Join Our
              <span className="text-transparent px-2 bg-gradient-to-r from-[#5865F2] to-[#7289DA] bg-clip-text">
                Discord Community
              </span>
            </h2>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            Connect with developers, share ideas, and get support for Hydra AI.
          </p>

          <div>
            <Link href="https://discord.gg/aQG5RxzKJg" target="_blank">
              <Button className="w-5/6 md:w-1/3 font-bold group/arrow">
                Join our Discord
                <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
