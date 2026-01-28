import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { defineTool } from '@tambo-ai/react';

export const queryRecords = defineTool({
  name: 'queryRecords',
  description: 'Fetches analytics records from the database. Can optionally filter by category.',
  inputSchema: z.object({
    category: z.string().optional().describe('The category of records to fetch (e.g., "sales", "users", "traffic")'),
  }),
  outputSchema: z.object({
    records: z.array(z.any()).describe('The list of fetched analytics records'),
  }),
  tool: async ({ category }: { category?: string }) => {
    let query = supabase.from('analytics').select('*').order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { records: data };
  },
});
