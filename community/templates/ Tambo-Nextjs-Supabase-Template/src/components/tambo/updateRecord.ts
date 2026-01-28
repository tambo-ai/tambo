import { supabase } from "../../lib/supabase";
import { z } from "zod";
import { defineTool } from "@tambo-ai/react";

export const updateRecord = defineTool({
  name: "updateRecord",
  description: "Updates an existing analytics record in the database.",
  inputSchema: z.object({
    id: z.string().describe("The ID of the record to update"),
    label: z.string().optional().describe("Updated label for the record"),
    value: z
      .number()
      .optional()
      .describe("Updated numeric value for the record"),
    category: z.string().optional().describe("Updated category for the record"),
  }),
  outputSchema: z.object({
    message: z.string().describe("Success message"),
    record: z.any().describe("The updated analytics record"),
  }),
  tool: async ({
    id,
    label,
    value,
    category,
  }: {
    id: string;
    label?: string;
    value?: number;
    category?: string;
  }) => {
    // Build update object with only provided fields
    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (category !== undefined) updateData.category = category;

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        "At least one field (label, value, or category) must be provided for update",
      );
    }

    const { data, error } = await supabase
      .from("analytics")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return {
        message: `Error updating record: ${error.message}`,
        record: null,
      };
    }

    if (!data || data.length === 0) {
      return {
        message: `Record with ID ${id} not found`,
        record: null,
      };
    }

    return {
      message: "Record updated successfully",
      record: data[0],
    };
  },
});
