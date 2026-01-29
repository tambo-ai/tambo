
/* eslint-disable */
import { z } from "zod";
import { ContactCard, ContactCardPropsSchema, ContactList, ContactListPropsSchema } from "../components/tambo";

export const tamboComponents = [
  {
    name: "ContactCard",
    description:
      "A professional card for displaying and managing contact leads. Use this when the user asks to see a person's details or when a contact is successfully created.",
    component: ContactCard,
    propsSchema: ContactCardPropsSchema,
  },
  {
    name: "ContactList",
    description:
      "A clean, scannable list of multiple contacts with avatars, company badges, and email buttons. Use this when displaying search results or multiple contacts.",
    component: ContactList,
    propsSchema: ContactListPropsSchema,
  },
];

const addContactSchema = z.object({
  name: z.string().describe("The full name of the contact person"),
  email: z
    .string()
    .email()
    .describe("The professional email address of the contact"),
  company: z
    .string()
    .optional()
    .describe("The company or organization the contact works for"),
  notes: z
    .string()
    .optional()
    .describe("Additional notes or comments about the contact"),
});

const searchContactsSchema = z.object({
  query: z.string().describe('Search term to find contacts by name or company'),
});

const updateContactSchema = z.object({
  id: z.number().describe('The ID of the contact to update'),
  name: z.string().optional().describe('Updated name of the contact'),
  email: z.string().email().optional().describe('Updated email address'),
  company: z.string().optional().describe('Updated company name'),
  notes: z.string().optional().describe('Updated notes about the contact'),
});

export const tamboTools = [
  {
    name: "add_contact",
    description:
      "Saves a new person or business contact to the local database. Extract name, email, and company from the user's message.",
    tool: async (params: z.infer<typeof addContactSchema>) => {
      try {
        const response = await fetch("/api/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          contact: result,
          message: `Contact ${params.name} has been successfully saved to the database.`,
        };
      } catch (_error) {
        return {
          success: false,
          error: "Failed to save contact to database",
        };
      }
    },
    inputSchema: addContactSchema,
    outputSchema: z.object({
      success: z.boolean(),
      contact: z
        .object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          company: z.string().optional(),
          notes: z.string().optional(),
        })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  {
    name: "search_contacts",
    description: "Search for existing contacts by name or company. Use this when the user asks to find, search, or look up contacts.",
    tool: async (params: z.infer<typeof searchContactsSchema>) => {
      try {
        const queryParams = new URLSearchParams();
        if (params.query) {
          queryParams.append('query', params.query);
        }
        
        const response = await fetch(`/api/contacts?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contacts = await response.json();
        return {
          success: true,
          contacts,
          message: `Found ${contacts.length} contact(s). Displaying results in ContactList.`,
        };
      } catch (_error) {
        return {
          success: false,
          error: 'Failed to search contacts',
        };
      }
    },
    inputSchema: searchContactsSchema,
    outputSchema: z.object({
      success: z.boolean(),
      contacts: z.array(z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        company: z.string().optional(),
        notes: z.string().optional(),
      })).optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  },
  {
    name: "update_contact",
    description: "Update an existing contact's information, especially useful for adding notes or updating details. Requires the contact ID.",
    tool: async (params: z.infer<typeof updateContactSchema>) => {
      try {
        const { id, ...updateData } = params;
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: `Contact updated successfully.`,
          id,
        };
      } catch (_error) {
        return {
          success: false,
          error: 'Failed to update contact',
        };
      }
    },
    inputSchema: updateContactSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      id: z.number().optional(),
      error: z.string().optional(),
    }),
  },
];

export const tamboConfig = {
  components: tamboComponents,
  tools: tamboTools,
};
