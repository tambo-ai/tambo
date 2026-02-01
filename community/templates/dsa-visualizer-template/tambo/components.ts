import type { TamboComponent } from "@tambo-ai/react";
import {
  ArrayVisualizer,
  arrayVisualizerSchema,
} from "@/components/ArrayVisualizer";
import { DPTable, dpTableSchema } from "@/components/DPTable";
import {
  CodeExplanation,
  codeExplanationSchema,
} from "@/components/CodeExplanation";
import {
  StepController,
  stepControllerSchema,
} from "@/components/StepController";

/**
 * Component Registry
 *
 * Registers all generative components with Tambo.
 * The AI uses these descriptions to decide WHICH component to render.
 *
 * Key principle: Each component has a clear "when to use" description.
 * The AI reads these descriptions to select the right component for the user's request.
 */
export const components: TamboComponent[] = [
  {
    name: "ArrayVisualizer",
    description: `Visualizes array-based algorithms and data structures.
    
USE THIS COMPONENT WHEN:
- User wants to see an array with values displayed as bars
- Visualizing sorting algorithms (bubble sort, quick sort, merge sort, etc.)
- Showing searching algorithms (binary search, linear search)
- Demonstrating two-pointer techniques
- Illustrating sliding window problems

FEATURES:
- Displays array values as proportional bars
- Highlights specific indices (for comparisons, swaps)
- Shows labeled pointers below indices (i, j, left, right, etc.)
- Includes caption for step explanations

EXAMPLE PROMPTS:
- "Visualize bubble sort"
- "Show binary search finding 7 in [1,3,5,7,9]"
- "Demonstrate two-pointer technique for Two Sum"`,
    component: ArrayVisualizer,
    propsSchema: arrayVisualizerSchema,
  },
  {
    name: "DPTable",
    description: `Renders 2D dynamic programming tables with transition highlighting.

USE THIS COMPONENT WHEN:
- User asks about dynamic programming problems
- Showing tabulation method solutions
- Visualizing DP state transitions
- Problems like: Knapsack, LCS, Edit Distance, Coin Change, etc.

FEATURES:
- Displays 2D table with optional row/column labels
- Highlights cells to show DP transitions
- Multiple highlight colors for path tracing
- Caption for explaining recurrence relations

EXAMPLE PROMPTS:
- "Show DP table for 0/1 Knapsack"
- "Visualize Longest Common Subsequence DP"
- "Explain Fibonacci with DP table"
- "Show edit distance table for 'cat' to 'dog'"`,
    component: DPTable,
    propsSchema: dpTableSchema,
  },
  {
    name: "CodeExplanation",
    description: `Displays algorithm code with detailed explanations and complexity analysis.

USE THIS COMPONENT WHEN:
- User wants to understand HOW an algorithm works
- Explaining algorithm implementation details
- Showing pseudocode with step-by-step breakdown
- Teaching time/space complexity concepts

FEATURES:
- Code block with syntax highlighting style
- Structured explanation section
- Time and space complexity badges
- Key insights bullet points

EXAMPLE PROMPTS:
- "Explain how merge sort works"
- "Show me the Two Sum solution with explanation"
- "What's the code for binary search?"
- "Explain quicksort partition logic"`,
    component: CodeExplanation,
    propsSchema: codeExplanationSchema,
  },
  {
    name: "StepController",
    description: `Interactive step-by-step algorithm execution controller.

USE THIS COMPONENT WHEN:
- User wants to step through an algorithm execution
- Providing a "dry run" of an algorithm
- Interactive learning with play/pause/next controls
- Walking through algorithm iterations

FEATURES:
- Play/pause controls
- Next/previous step navigation
- Reset to beginning
- Progress bar and step counter
- State preserved within the component

EXAMPLE PROMPTS:
- "Walk me through bubble sort step by step"
- "Give me a dry run of binary search"
- "Show me each iteration of the algorithm"`,
    component: StepController,
    propsSchema: stepControllerSchema,
  },
];
