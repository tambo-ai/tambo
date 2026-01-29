"use client";
import {
  TicketingSystem,
  TicketingSystemPropsSchema,
} from "@/components/ticketing-system";
import { ticketTools } from "@/lib/ticket-tools";
import { TamboProvider, type TamboComponent } from "@tambo-ai/react";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const wrappedTools = useMemo(() => {
    if (!session?.userId) return ticketTools;

    return ticketTools.map((tool) => ({
      ...tool,
      tool: async (input: Record<string, unknown>) => {
        if (tool.name === "createTicket" || tool.name === "fetchUserTickets") {
          return tool.tool({ ...input, userId: session.userId });
        }
        return tool.tool(input);
      },
    }));
  }, [session]);

  const tamboComponents: TamboComponent[] = useMemo(
    () => [
      {
        name: "TicketingSystem",
        description:
          "Displays a list of support tickets. Use this when showing tickets after fetching them or after creating a new ticket.",
        component: TicketingSystem,
        propsSchema: TicketingSystemPropsSchema,
      },
    ],
    [],
  );

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      userToken={session?.accessToken}
      tools={wrappedTools}
      components={tamboComponents}
    >
      {children}
    </TamboProvider>
  );
}
