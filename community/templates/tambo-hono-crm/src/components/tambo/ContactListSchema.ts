import { z } from "zod";

export const ContactListPropsSchema = z.object({
  contacts: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        company: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .describe("Array of contacts to display"),
  title: z.string().optional().describe("Title for the contact list"),
});

export type ContactListProps = z.infer<typeof ContactListPropsSchema>;
