import { z } from 'zod';

export const ContactCardPropsSchema = z.object({
  name: z.string().describe('The full name of the contact person'),
  email: z.string().email().describe('The professional email address of the contact'),
  company: z.string().optional().describe('The company or organization the contact works for'),
  notes: z.string().optional().describe('Additional notes or comments about the contact'),
});

export type ContactCardProps = z.infer<typeof ContactCardPropsSchema>;
