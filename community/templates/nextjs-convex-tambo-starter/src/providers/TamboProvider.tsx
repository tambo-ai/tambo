"use client";

import { getLeadTools } from "@/components/tambo/LeadManagerTools";
import { TamboProvider as BaseTamboProvider } from "@tambo-ai/react";
import { useConvex, useMutation } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";

export function TamboProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const addLead = useMutation(api.leads.add);
  const updateStatus = useMutation(api.leads.updateStatus);
  const removeLead = useMutation(api.leads.remove);

  const tools = useMemo(
    () => getLeadTools({ addLead, updateStatus, removeLead, convex, api }),
    [addLead, updateStatus, removeLead, convex],
  );

  return (
    <BaseTamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
    >
      {children}
    </BaseTamboProvider>
  );
}
