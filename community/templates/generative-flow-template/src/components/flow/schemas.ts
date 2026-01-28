import { z } from "zod";

export const nodeSchema = z.object({
    id: z.string(),
    type: z.string(), // 'trigger', 'action', 'logic' etc.
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    data: z.object({
        label: z.string(),
        description: z.string().optional(),
        // Explicit config fields instead of z.record
        channel: z.string().optional().describe("For Slack nodes"),
        message: z.string().optional().describe("For Slack nodes"),
        repo: z.string().optional().describe("For GitHub nodes"),
        event: z.string().optional().describe("For GitHub nodes"),
        prompt: z.string().optional().describe("For LLM nodes"),
    }),
});

export const edgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    animated: z.boolean().optional(),
    label: z.string().optional(),
});

export const flowCanvasSchema = z.object({
    nodes: z.array(nodeSchema).describe("List of workflow nodes to render"),
    edges: z.array(edgeSchema).describe("List of connections between nodes"),
    summary: z.string().describe("Brief summary of what this workflow does"),
});
