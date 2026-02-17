/**
 * Filesystem tools for the agentic execution loop
 *
 * These tools are registered with a ToolRegistry and used by the LLM
 * to read, write, and list files during code execution.
 */

import type { ToolDefinition } from "@tambo-ai/client-core";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const readFileInputSchema = z.object({
  filePath: z
    .string()
    .describe("Relative or absolute path to the file to read"),
});

const writeFileInputSchema = z.object({
  filePath: z
    .string()
    .describe("Relative or absolute path to the file to write"),
  content: z.string().describe("Content to write to the file"),
});

const listFilesInputSchema = z.object({
  dirPath: z
    .string()
    .describe("Relative or absolute path to the directory to list"),
  pattern: z
    .string()
    .nullish()
    .describe("Optional glob-like suffix filter (e.g. '.tsx')"),
});

/**
 * Resolve a path relative to the project root (cwd)
 */
function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(process.cwd(), filePath);
}

/**
 * Tool: read a file's contents
 */
export const readFileTool: ToolDefinition<
  z.infer<typeof readFileInputSchema>,
  string
> = {
  name: "readFile",
  description:
    "Read the contents of a file. Returns the file content as a string.",
  inputSchema: readFileInputSchema,
  async execute({ filePath }) {
    const resolved = resolvePath(filePath);
    return await fs.readFile(resolved, "utf-8");
  },
};

/**
 * Tool: write content to a file, creating directories as needed
 */
export const writeFileTool: ToolDefinition<
  z.infer<typeof writeFileInputSchema>,
  string
> = {
  name: "writeFile",
  description:
    "Write content to a file. Creates parent directories if they don't exist. Returns the absolute path of the written file.",
  inputSchema: writeFileInputSchema,
  async execute({ filePath, content }) {
    const resolved = resolvePath(filePath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, "utf-8");
    return resolved;
  },
};

/** Directories to exclude from recursive file listings */
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  ".cache",
  "coverage",
  ".vercel",
  ".output",
]);

/**
 * Recursively list files, skipping excluded directories
 */
async function listFilesRecursive(
  dirPath: string,
  basePath: string,
): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      const subFiles = await listFilesRecursive(
        path.join(dirPath, entry.name),
        basePath,
      );
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(path.relative(basePath, path.join(dirPath, entry.name)));
    }
  }

  return files;
}

/**
 * Tool: list files in a directory
 */
export const listFilesTool: ToolDefinition<
  z.infer<typeof listFilesInputSchema>,
  string[]
> = {
  name: "listFiles",
  description:
    "List files in a directory. Optionally filter by file extension suffix (e.g. '.tsx'). Returns an array of relative file paths. Automatically excludes node_modules, .git, and other build directories.",
  inputSchema: listFilesInputSchema,
  async execute({ dirPath, pattern }) {
    const resolved = resolvePath(dirPath);
    let files = await listFilesRecursive(resolved, resolved);

    if (pattern) {
      files = files.filter((f) => f.endsWith(pattern));
    }

    return files;
  },
};

const readFilesInputSchema = z.object({
  filePaths: z
    .array(z.string())
    .describe("Array of relative or absolute file paths to read"),
});

/**
 * Tool: read multiple files in a single call
 */
export const readFilesTool: ToolDefinition<
  z.infer<typeof readFilesInputSchema>,
  { filePath: string; content?: string; error?: string }[]
> = {
  name: "readFiles",
  description:
    "Read multiple files at once. Returns an array of objects with filePath and content (or error if the file could not be read).",
  inputSchema: readFilesInputSchema,
  async execute({ filePaths }) {
    return await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const resolved = resolvePath(filePath);
          const content = await fs.readFile(resolved, "utf-8");
          return { filePath, content };
        } catch (err) {
          return {
            filePath,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );
  },
};

const submitPlanInputSchema = z.object({
  stepIds: z
    .array(z.string())
    .describe(
      'Short unique ID for each step, e.g. ["provider","registry","widget"]',
    ),
  stepDescriptions: z
    .array(z.string())
    .describe(
      'Human-readable description for each step (same order as stepIds), e.g. ["Set up TamboProvider in layout","Register components in lib/tambo.ts","Add chat widget to page"]',
    ),
});

export interface PlanStep {
  id: string;
  description: string;
  status: "pending" | "done";
}

/**
 * Build the markdown content for the execution plan file
 *
 * @returns Markdown string with YAML frontmatter tracking step statuses
 */
function buildPlanMarkdown(steps: PlanStep[]): string {
  const yamlSteps = steps
    .map(
      (s) =>
        `  - id: ${s.id}\n    description: "${s.description.replace(/"/g, '\\"')}"\n    status: ${s.status}`,
    )
    .join("\n");

  const body = steps
    .map((s) => {
      const checkbox = s.status === "done" ? "[x]" : "[ ]";
      return `- ${checkbox} **${s.id}**: ${s.description}`;
    })
    .join("\n");

  return `---\nsteps:\n${yamlSteps}\n---\n\n# Execution Plan\n\n${body}\n`;
}

const PLAN_FILE = ".tambo/execution-plan.md";

/**
 * Tool: submit an execution plan with steps
 */
export const submitPlanTool: ToolDefinition<
  z.infer<typeof submitPlanInputSchema>,
  { steps: PlanStep[] }
> = {
  name: "submitPlan",
  description:
    "Submit a structured execution plan before making changes. Call this first with parallel arrays of step IDs and descriptions.",
  inputSchema: submitPlanInputSchema,
  async execute({ stepIds, stepDescriptions }) {
    const planSteps: PlanStep[] = stepIds.map((id, i) => ({
      id,
      description: stepDescriptions[i] ?? id,
      status: "pending" as const,
    }));
    const resolved = resolvePath(PLAN_FILE);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, buildPlanMarkdown(planSteps), "utf-8");
    return { steps: planSteps };
  },
};

const updatePlanInputSchema = z.object({
  stepId: z.string().describe("The step ID to mark as done"),
});

/**
 * Tool: mark a plan step as done
 */
export const updatePlanTool: ToolDefinition<
  z.infer<typeof updatePlanInputSchema>,
  { remaining: number }
> = {
  name: "updatePlan",
  description:
    "Mark a plan step as done after completing it. Returns the number of remaining steps.",
  inputSchema: updatePlanInputSchema,
  async execute({ stepId }) {
    const resolved = resolvePath(PLAN_FILE);
    const content = await fs.readFile(resolved, "utf-8");

    // Parse steps from YAML frontmatter
    const frontmatterMatch = /^---\nsteps:\n([\s\S]*?)\n---/.exec(content);
    if (!frontmatterMatch) {
      throw new Error("Could not parse execution plan file");
    }

    // Parse step entries from YAML
    const stepEntries = frontmatterMatch[1].split("\n  - ").filter(Boolean);
    const steps: PlanStep[] = stepEntries.map((entry) => {
      const idMatch = /id: (.+)/.exec(entry);
      const descMatch = /description: "(.+?)"/.exec(entry);
      const statusMatch = /status: (.+)/.exec(entry);
      return {
        id: idMatch?.[1] ?? "",
        description: descMatch?.[1] ?? "",
        status: (statusMatch?.[1] as "pending" | "done") ?? "pending",
      };
    });

    const step = steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step "${stepId}" not found in execution plan`);
    }

    step.status = "done";
    await fs.writeFile(resolved, buildPlanMarkdown(steps), "utf-8");

    const remaining = steps.filter((s) => s.status === "pending").length;
    return { remaining };
  },
};

/** All filesystem tools for registration */
export const agentTools = [
  readFileTool,
  readFilesTool,
  writeFileTool,
  listFilesTool,
  submitPlanTool,
  updatePlanTool,
] as const;
