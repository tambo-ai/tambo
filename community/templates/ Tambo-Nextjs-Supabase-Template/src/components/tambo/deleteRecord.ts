import { supabase } from "../../lib/supabase";
import { z } from "zod";
import { defineTool } from "@tambo-ai/react";

export const deleteRecord = defineTool({
  name: "deleteRecord",
  description: "Deletes an analytics record from the database by ID.",
  inputSchema: z.object({
    id: z.string().describe("The ID of the record to delete"),
  }),
  outputSchema: z.object({
    message: z.string().describe("Success message"),
    deletedId: z.string().describe("The ID of the deleted record"),
  }),
  tool: async ({ id }: { id: string }) => {
    try {
      // Delete the record directly
      const { data, error } = await supabase
        .from("analytics")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        return {
          message: `Error deleting record: ${error.message}`,
          deletedId: id,
        };
      }

      if (!data || data.length === 0) {
        return {
          message: `Record with ID ${id} not found or already deleted`,
          deletedId: id,
        };
      }

      return {
        message: `Record with ID ${id} deleted successfully`,
        deletedId: id,
      };
    } catch (err: any) {
      return {
        message: `Error deleting record: ${err?.message || "Unknown error"}`,
        deletedId: id,
      };
    }
  },
});
