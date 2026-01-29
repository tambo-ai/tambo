/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components.
 * It exports arrays that will be used by the TamboProvider.
 */

import { CodeViewer, codeViewerSchema } from "@/components/tambo/CodeViewer";
import {
  DocExplanation,
  docExplanationSchema,
} from "@/components/tambo/DocExplanation";
import {
  RelatedTopics,
  relatedTopicsSchema,
} from "@/components/tambo/RelatedTopics";
import type { TamboComponent } from "@tambo-ai/react";

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "CodeViewer",
    description:
      "A component that displays code examples with syntax highlighting and copy-to-clipboard functionality. Perfect for showing code snippets, examples, and implementations. Supports multiple programming languages including TypeScript, JavaScript, Python, and more. Features a clean design with dark mode support.",
    component: CodeViewer,
    propsSchema: codeViewerSchema,
  },
  {
    name: "DocExplanation",
    description:
      "A component that displays formatted documentation explanations with titles and optional category tags. Use this to explain concepts, provide detailed descriptions, or answer 'what is' or 'how does it work' questions. Includes visual categorization for topics like 'State Management', 'Performance', 'Side Effects', etc.",
    component: DocExplanation,
    propsSchema: docExplanationSchema,
  },
  {
    name: "RelatedTopics",
    description:
      "A component that displays a grid of related documentation topics with titles and descriptions. Use this when users ask about related concepts, similar topics, or want to explore connected documentation. Each topic is clickable and shows a brief description to help users navigate the documentation.",
    component: RelatedTopics,
    propsSchema: relatedTopicsSchema,
  },
];
