/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 */

import { FlowCanvas } from "@/components/flow/flow-canvas";
import { flowCanvasSchema } from "@/components/flow/schemas";
import { NodeConfig, nodeConfigSchema } from "@/components/flow/node-config";
import { z } from "zod";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";

import { generateWorkflow, generateWorkflowSchema } from "@/tools/workflow-generator";

/**
 * tools
 * Registered tools for AutoFlow.
 */
export const tools: TamboTool[] = [
  {
    name: "generate_workflow",
    description: "Helper tool to analyze a workflow request. Use this to help plan the node structure before rendering the canvas.",
    tool: generateWorkflow,
    inputSchema: generateWorkflowSchema,
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
      hints: z.array(z.string()),
    }),
  }
];


/**
 * components
 * Registered components for AutoFlow.
 */
export const components: TamboComponent[] = [
  {
    name: "FlowCanvas",
    description: "The main workflow editor canvas. Use this to render the node graph when the user asks to create, modify, or view a workflow.",
    component: FlowCanvas,
    propsSchema: flowCanvasSchema,
  },
  {
    name: "NodeConfig",
    description: "A generative configuration panel. Render this when the user wants to edit settings for a specific step (e.g. 'Configure the Slack node').",
    component: NodeConfig,
    propsSchema: nodeConfigSchema,
  }
];
