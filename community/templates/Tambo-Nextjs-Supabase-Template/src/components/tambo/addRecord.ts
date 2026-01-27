import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { defineTool } from '@tambo-ai/react';

export const addRecord = defineTool({
  name: 'addRecord',
  description: 'Adds a new analytics record to the database.',
  inputSchema: z.object({
    label: z.string().describe('A descriptive label for the record'),
    value: z.number().describe('The numeric value for the record'),
    category: z.string().describe('The category for the record (e.g., "sales", "users", "traffic")'),
  }),
  outputSchema: z.object({
    message: z.string().describe('Success message'),
    record: z.any().describe('The newly created analytics record'),
  }),
  tool: async ({ label, value, category }: { label: string; value: number; category: string }) => {
    const { data, error } = await supabase
      .from('analytics')
      .insert([{ label, value, category }])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return { 
      message: 'Record added successfully',
      record: data[0] 
    };
  },
});
