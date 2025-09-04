"use client";

// Central configuration file for Tambo components and tools
// Read more about Tambo at https://tambo.co/docs

import { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Tambo tools registered for AI use
export const tools: TamboTool[] = [
  {
    name: "mockUploader",
    description: "Mock file uploader for testing FileUpload component",
    tool: async (
      files: File[],
      onProgress: (id: string, progress: number) => void,
    ): Promise<string[]> => {
      return await new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          files.forEach((file) => {
            onProgress(file.name, progress);
          });

          if (progress >= 100) {
            clearInterval(interval);
            resolve(
              files.map((file) => `https://example.com/uploaded/${file.name}`),
            );
          }
        }, 200);
      });
    },
    toolSchema: z
      .function()
      .args(
        z.array(z.any()).describe("Array of files to upload"),
        z
          .function()
          .args(z.string(), z.number())
          .returns(z.void())
          .describe("Progress callback function"),
      )
      .returns(
        z
          .promise(z.array(z.string()))
          .describe("Promise that resolves to array of file URLs"),
      ),
  },
];

// Tambo components registered for AI use
export const components: TamboComponent[] = [];
