"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useUserContextKey } from "@/lib/useUserContextKey";
import { MobileProvider } from "@/providers/mobile-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TamboProvider } from "@tambo-ai/react";
import { MCPTransport } from "@tambo-ai/react/mcp";
import { usePathname } from "next/navigation";

const MCP_DEMO_URL =
  process.env.NEXT_PUBLIC_MCP_DEMO_URL || "https://everything-mcp.tambo.co/mcp";

export default function Template({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isNotFoundPage = pathname === "/_not-found";
  const userContextKey = useUserContextKey(pathname || "default-page");
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MobileProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <Sidebar />
          <div className="w-full md:pl-64 transition-all duration-300">
            <main>
              {isNotFoundPage ? (
                <div className="container mx-auto px-4 md:px-6 pt-6">
                  {children}
                </div>
              ) : (
                <TamboProvider
                  apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? ""}
                  tamboUrl={process.env.NEXT_PUBLIC_TAMBO_API_URL ?? ""}
                  mcpServers={[
                    { url: MCP_DEMO_URL, transport: MCPTransport.HTTP },
                  ]}
                  contextKey={userContextKey}
                  listResources={async (search = "X") => {
                    console.log("listResources", search);
                    return [
                      {
                        uri: `generic-registry-resource/${search}`,
                        name: `Generic Registry Resource ${search}`,
                        description: `This is a generic registry resource ${search}`,
                        mimeType: "text/plain",
                      },
                    ];
                  }}
                  getResource={async (uri) => {
                    console.log("getResource", uri);
                    return {
                      contents: [
                        {
                          uri,
                          text: `This is a generic registry resource for ${uri}`,
                          mimeType: "text/plain",
                        },
                      ],
                    };
                  }}
                >
                  <div className="container mx-auto px-4 md:px-6 pt-6">
                    {children}
                  </div>
                </TamboProvider>
              )}
            </main>
          </div>
        </div>
      </MobileProvider>
    </ThemeProvider>
  );
}
