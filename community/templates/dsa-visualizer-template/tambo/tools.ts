import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Tool Registry
 *
 * Tools implement LOGIC - they do computation and return structured data.
 * The AI orchestrates WHEN to call these tools.
 *
 * Critical Rule: Tools contain NO UI logic and make NO AI decisions.
 * They are pure functions that take inputs and return outputs.
 */

/**
 * Generates the next step in an algorithm execution
 */
export const computeNextStepTool: TamboTool = {
  name: "computeNextStep",
  description: `Computes the next step in an algorithm's execution.
    Use this to advance the state of a step-by-step algorithm walkthrough.
    Returns the new state after executing one step.`,
  toolSchema: z
    .function()
    .args(
      z.object({
        algorithm: z
          .string()
          .describe(
            "Name of the algorithm (e.g., 'bubbleSort', 'binarySearch')"
          ),
        currentState: z
          .object({
            array: z.array(z.number()).describe("Current array state"),
            step: z.number().describe("Current step number"),
            pointers: z
              .record(z.number())
              .optional()
              .describe("Current pointer positions"),
          })
          .describe("Current state of the algorithm execution"),
      })
    )
    .returns(
      z.object({
        newState: z.object({
          array: z.array(z.number()).describe("New array state after the step"),
          step: z.number().describe("New step number"),
          pointers: z
            .record(z.number())
            .optional()
            .describe("New pointer positions"),
          isComplete: z
            .boolean()
            .describe("Whether the algorithm has finished"),
        }),
        description: z
          .string()
          .describe("Description of what happened in this step"),
      })
    ),
  tool: (input: {
    algorithm: string;
    currentState: {
      array: number[];
      step: number;
      pointers?: Record<string, number>;
    };
  }) => {
    const { algorithm, currentState } = input;
    const { array, step, pointers = {} } = currentState;
    const newArray = [...array];

    // Simple bubble sort step as example
    if (algorithm === "bubbleSort") {
      const n = newArray.length;
      const i = Math.floor(step / (n - 1));
      const j = step % (n - 1);

      if (i >= n - 1) {
        return {
          newState: {
            array: newArray,
            step: step,
            pointers: {},
            isComplete: true,
          },
          description: "Sorting complete!",
        };
      }

      const comparing = j < n - 1 - i;
      if (comparing && newArray[j] > newArray[j + 1]) {
        [newArray[j], newArray[j + 1]] = [newArray[j + 1], newArray[j]];
        return {
          newState: {
            array: newArray,
            step: step + 1,
            pointers: { i, j: j + 1 },
            isComplete: false,
          },
          description: `Swapped ${array[j]} and ${array[j + 1]} at positions ${j} and ${j + 1}`,
        };
      }

      return {
        newState: {
          array: newArray,
          step: step + 1,
          pointers: { i, j: j + 1 },
          isComplete: false,
        },
        description: `Compared ${newArray[j]} and ${newArray[j + 1]} - no swap needed`,
      };
    }

    // Binary search step
    if (algorithm === "binarySearch") {
      const { left = 0, right = array.length - 1, target = 0 } = pointers;
      const mid = Math.floor((left + right) / 2);

      if (left > right) {
        return {
          newState: {
            array: newArray,
            step: step + 1,
            pointers: { left, right, mid },
            isComplete: true,
          },
          description: `Target ${target} not found in array`,
        };
      }

      if (newArray[mid] === target) {
        return {
          newState: {
            array: newArray,
            step: step + 1,
            pointers: { left, right, mid },
            isComplete: true,
          },
          description: `Found target ${target} at index ${mid}!`,
        };
      }

      if (newArray[mid] < target) {
        return {
          newState: {
            array: newArray,
            step: step + 1,
            pointers: { left: mid + 1, right, target },
            isComplete: false,
          },
          description: `${newArray[mid]} < ${target}, searching right half`,
        };
      }

      return {
        newState: {
          array: newArray,
          step: step + 1,
          pointers: { left, right: mid - 1, target },
          isComplete: false,
        },
        description: `${newArray[mid]} > ${target}, searching left half`,
      };
    }

    // Default: just increment step
    return {
      newState: {
        array: newArray,
        step: step + 1,
        pointers,
        isComplete: step >= 10,
      },
      description: `Executed step ${step + 1}`,
    };
  },
};

/**
 * Resets an algorithm execution to its initial state
 */
export const resetExecutionTool: TamboTool = {
  name: "resetExecution",
  description: `Resets an algorithm execution back to its initial state.
    Use this when the user wants to start over or reset the visualization.`,
  toolSchema: z
    .function()
    .args(
      z.object({
        algorithm: z.string().describe("Name of the algorithm to reset"),
        initialArray: z
          .array(z.number())
          .optional()
          .describe("Optional new initial array"),
      })
    )
    .returns(
      z.object({
        state: z.object({
          array: z.array(z.number()).describe("Initial array state"),
          step: z.number().describe("Step number (always 0)"),
          pointers: z.record(z.number()).describe("Initial pointer positions"),
          isComplete: z.boolean().describe("Always false after reset"),
        }),
        message: z.string().describe("Confirmation message"),
      })
    ),
  tool: (input: { algorithm: string; initialArray?: number[] }) => {
    const array = input.initialArray || [64, 34, 25, 12, 22, 11, 90];

    return {
      state: {
        array,
        step: 0,
        pointers: {},
        isComplete: false,
      },
      message: `Reset execution. Ready to start with array: [${array.join(", ")}]`,
    };
  },
};

/**
 * Generates array data for visualization
 */
export const generateArrayDataTool: TamboTool = {
  name: "generateArrayData",
  description: `Generates array data for algorithm visualization.
    Use this to create sample arrays for demonstrations.`,
  toolSchema: z
    .function()
    .args(
      z.object({
        size: z
          .number()
          .min(2)
          .max(20)
          .optional()
          .describe("Size of array (2-20)"),
        type: z
          .enum(["random", "sorted", "reversed", "nearlySorted"])
          .optional()
          .describe("Type of array to generate"),
        min: z.number().optional().describe("Minimum value"),
        max: z.number().optional().describe("Maximum value"),
      })
    )
    .returns(
      z.object({
        array: z.array(z.number()).describe("Generated array"),
        description: z
          .string()
          .describe("Description of the generated array"),
      })
    ),
  tool: (input: {
    size?: number;
    type?: "random" | "sorted" | "reversed" | "nearlySorted";
    min?: number;
    max?: number;
  }) => {
    const actualSize = input.size ?? 8;
    const actualType = input.type ?? "random";
    const actualMin = input.min ?? 1;
    const actualMax = input.max ?? 100;

    let array: number[] = [];

    switch (actualType) {
      case "sorted":
        array = Array.from({ length: actualSize }, (_, i) =>
          Math.floor(
            actualMin + ((actualMax - actualMin) * i) / (actualSize - 1)
          )
        );
        break;
      case "reversed":
        array = Array.from({ length: actualSize }, (_, i) =>
          Math.floor(
            actualMax - ((actualMax - actualMin) * i) / (actualSize - 1)
          )
        );
        break;
      case "nearlySorted":
        array = Array.from({ length: actualSize }, (_, i) =>
          Math.floor(
            actualMin + ((actualMax - actualMin) * i) / (actualSize - 1)
          )
        );
        // Swap a couple of elements
        if (actualSize > 2) {
          const swapIdx = Math.floor(actualSize / 2);
          [array[swapIdx], array[swapIdx + 1]] = [
            array[swapIdx + 1],
            array[swapIdx],
          ];
        }
        break;
      default:
        array = Array.from({ length: actualSize }, () =>
          Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin
        );
    }

    return {
      array,
      description: `Generated ${actualType} array of ${actualSize} elements: [${array.join(", ")}]`,
    };
  },
};

/**
 * Export all tools
 */
export const tools: TamboTool[] = [
  computeNextStepTool,
  resetExecutionTool,
  generateArrayDataTool,
];
