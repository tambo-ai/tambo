/**
 * Project analysis module - main orchestrator and type exports
 *
 * This module analyzes a project's codebase to detect framework, structure,
 * TypeScript configuration, providers, components, and potential tool candidates.
 */

import { detectPackageManager } from "../package-manager.js";
import { detectComponents } from "./component-detection.js";
import { detectFrameworkInfo } from "./framework-detection.js";
import { detectProviders } from "./provider-detection.js";
import {
  detectProjectStructure,
  detectTypeScriptConfig,
} from "./structure-detection.js";
import { detectToolCandidates } from "./tool-detection.js";
import type { ProjectAnalysis } from "./types.js";

// Re-export all types for convenient imports
export type {
  ComponentInfo,
  FrameworkInfo,
  FrameworkName,
  NextJsVariant,
  ProjectAnalysis,
  ProjectStructure,
  ProviderInfo,
  ToolCandidate,
  TypeScriptInfo,
} from "./types.js";

// Re-export individual detection functions for direct use
export { detectComponents } from "./component-detection.js";
export { detectFrameworkInfo } from "./framework-detection.js";
export { detectProviders } from "./provider-detection.js";
export {
  detectProjectStructure,
  detectTypeScriptConfig,
} from "./structure-detection.js";
export { detectToolCandidates } from "./tool-detection.js";

/**
 * Analyzes a project's codebase to detect framework, structure, and components
 *
 * This function orchestrates all detection modules to produce a comprehensive
 * analysis of the project. It runs the following detections in order:
 *
 * 1. Framework detection (Next.js, Vite, Remix, CRA)
 * 2. Project structure detection (src/, app/, pages/, components/)
 * 3. TypeScript configuration detection
 * 4. Package manager detection (npm, pnpm, yarn, rush)
 * 5. Provider detection (if root layout exists)
 * 6. Component detection (if component directories exist)
 * 7. Tool candidate detection (server actions, fetch calls, exported functions)
 *
 * @param projectRoot - Absolute path to the project root directory
 * @returns Complete project analysis with all detected information
 */
export function analyzeProject(projectRoot: string): ProjectAnalysis {
  // 1. Detect framework
  const framework = detectFrameworkInfo(projectRoot);

  // 2. Detect project structure
  const structure = detectProjectStructure(projectRoot, framework);

  // 3. Detect TypeScript configuration
  const typescript = detectTypeScriptConfig(projectRoot);

  // 4. Detect package manager
  const packageManager = detectPackageManager(projectRoot);

  // 5. Detect providers (if root layout exists)
  const providers = structure.rootLayoutPath
    ? detectProviders(structure.rootLayoutPath)
    : [];

  // 6. Detect components (if component directories exist)
  const components =
    structure.componentsDirs.length > 0
      ? detectComponents(structure.componentsDirs)
      : [];

  // 7. Detect tool candidates
  const toolCandidates = detectToolCandidates(projectRoot);

  return {
    framework,
    structure,
    typescript,
    packageManager,
    providers,
    components,
    toolCandidates,
  };
}
