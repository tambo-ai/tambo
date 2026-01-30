import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";

/**
 * Tool: Get all students
 */
export const getAllStudentsTool: TamboTool<
  Record<string, never>,
  {
    id: number;
    name: string;
    subject: string;
    score: number;
  }[]
> = {
  name: "getAllStudents",
  description: "Fetch all students with their scores",

  inputSchema: z.object({}),

  outputSchema: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      subject: z.string(),
      score: z.number(),
    }),
  ),

  tool: async () => {
    try {
      const response = await fetch("/api/students/all");
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`API error (${response.status}): ${body}`);
      }

      const students = (await response.json()) as {
        id: number;
        name: string;
        subject: string;
        score: number;
      }[];

      return students;
    } catch (error) {
      throw new Error(
        `Failed to fetch students: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

/**
 * Get students below a score threshold
 */
export const getLowPerformersTool: TamboTool<
  { threshold?: number },
  {
    id: number;
    name: string;
    subject: string;
    score: number;
  }[]
> = {
  name: "getLowPerformers",
  description: "Fetch students scoring below a given threshold",

  inputSchema: z.object({
    threshold: z.number().optional(),
  }),

  outputSchema: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      subject: z.string(),
      score: z.number(),
    }),
  ),

  tool: async ({ threshold = 60 }) => {
    try {
      const response = await fetch(
        `/api/students/low-performers?threshold=${encodeURIComponent(threshold)}`,
      );
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`API error (${response.status}): ${body}`);
      }

      const students = (await response.json()) as {
        id: number;
        name: string;
        subject: string;
        score: number;
      }[];

      return students;
    } catch (error) {
      throw new Error(
        `Failed to fetch low performers: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

/**
 * Subject-wise summary
 */
export const getSubjectSummaryTool: TamboTool<
  Record<string, never>,
  {
    subject: string;
    averageScore: number;
    studentCount: number;
  }[]
> = {
  name: "getSubjectSummary",
  description: "Get subject-wise average scores and student counts",

  inputSchema: z.object({}),

  outputSchema: z.array(
    z.object({
      subject: z.string(),
      averageScore: z.number(),
      studentCount: z.number(),
    }),
  ),

  tool: async () => {
    try {
      const response = await fetch("/api/students/subject-summary");
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`API error (${response.status}): ${body}`);
      }

      const result = (await response.json()) as {
        subject: string;
        averageScore: number;
        studentCount: number;
      }[];

      return result;
    } catch (error) {
      throw new Error(
        `Failed to generate subject summary: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};
