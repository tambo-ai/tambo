import { CLI } from "@/components/cli";
import DiscordIcon from "@/components/icons/discord-icon";
import { Section } from "@/components/section"; // Assuming Section component is appropriate for layout
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

export const McpPage: FC = () => {
  return (
    <main className="flex flex-col">
      <Header className="px-4 sm:px-6 lg:px-8" transparent={false} />
      <div className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Section id="mcp-demo" className="space-y-8 md:space-y-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight">
                MCP + Gen UI with tambo-ai
              </h1>
            </div>

            {/* Video Demo Section */}
            <div className="aspect-video w-full max-w-2xl mx-auto bg-muted rounded-lg overflow-hidden shadow-lg">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/8ObjEFMeXOY"
                title="MCP Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* CLI Setup Section */}
            <div className="flex flex-col items-center">
              <CLI
                items={[
                  {
                    id: "mcp",
                    label: "Create MCP App",
                    command: "npm create tambo-app@latest",
                  },
                ]}
                title="Create MCP App"
                className="w-full max-w-2xl mx-auto"
                theme="light"
              />
            </div>

            {/* Relevant docs */}
            <div className="flex flex-col items-center">
              <Link
                href="https://docs.tambo.co/concepts/model-context-protocol"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-base flex items-center gap-2 py-3 px-6 rounded-md",
                )}
              >
                <BookOpen className="w-5 h-5" />
                Read MCP Docs
              </Link>
            </div>

            {/* Discord Button */}
            <div className="flex justify-center mb-0 space-y-0">
              <Link
                href="https://discord.gg/dJNvPEHth6"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-base flex items-center gap-2 py-3 px-6 rounded-md",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon className="h-5 w-5" />
                join our discord
              </Link>
            </div>
          </Section>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default McpPage;
