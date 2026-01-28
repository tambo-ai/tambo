/* eslint-disable */
import { z } from 'zod';
import { ContactCard, ContactCardPropsSchema } from '../components/tambo';

export const tamboComponents = [
  {
    name: 'ContactCard',
    description: 'A professional card for displaying and managing contact leads. Use this when the user asks to see a person\'s details or when a contact is successfully created.',
    component: ContactCard,
    propsSchema: ContactCardPropsSchema,
  },
];

const addContactSchema = z.object({
  name: z.string().describe('The full name of the contact person'),
  email: z.string().email().describe('The professional email address of the contact'),
  company: z.string().optional().describe('The company or organization the contact works for'),
  notes: z.string().optional().describe('Additional notes or comments about the contact'),
});

export const tamboTools = [
  {
    name: 'add_contact',
    description: 'Saves a new person or business contact to the local database. Extract name, email, and company from the user\'s message.',
    tool: async (params: z.infer<typeof addContactSchema>) => {
      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          error: 'Failed to save contact to database',
        };
      }
    },
    inputSchema: addContactSchema,
    outputSchema: z.object({
      success: z.boolean(),
      contact: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        company: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  },
];

export const tamboConfig = {
  components: tamboComponents,
  tools: tamboTools,
};