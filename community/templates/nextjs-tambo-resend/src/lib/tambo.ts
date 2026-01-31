/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import { EmailPreview } from "@/components/tambo/email-preview";
import { saveEmailDraft } from "@/services/save-email";
import { listEmails } from "@/services/list-emails";
import { sendEmailAndPersist } from "@/services/send-email-and-persist";



import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { listContacts } from "@/services/list-contacts";
import { saveContact } from "@/services/save-contact";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
{
  name: "saveEmailDraft",
  description: "Save an email draft",
  tool: saveEmailDraft,
  toolSchema: z.function().args(
    z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    })
  ),
},
{
  name: "sendEmailAndPersist",
  description: "Send email and persist it as sent",
  tool: sendEmailAndPersist,
  toolSchema: z.function().args(
    z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    })
  ),
},
{
  name: "listEmails",
  description: "List email drafts or sent emails",
  tool: listEmails,
  toolSchema: z.function().args(
    z.object({
      status: z.enum(["draft", "sent"]).optional(),
    }).optional()
  ),
},
{
  name: "listContacts",
  description: "List saved email contacts for the current user",
  tool: listContacts,
  toolSchema: z.function().args(
    z.object({
      userId: z.string().uuid(),
    })
  ),
},
{
    name: "saveContact",
    description: "Save a new email contact (name and email address) to the database for the current user",
    tool: saveContact,
    toolSchema: z.function().args(
      z.object({
        name: z.string().describe("Contact's full name"),
        email: z.string().email().describe("Contact's email address"),
      })
    ),
  },

  // Add more tools here
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
  name: "EmailPreview",
  description: "Preview an email before sending it",
  component: EmailPreview,
  propsSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
},
];
