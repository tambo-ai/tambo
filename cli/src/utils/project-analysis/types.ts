/**
 * Core types for project analysis module
 */

/** Supported framework names */
export type FrameworkName = "next" | "vite" | "remix" | "cra" | "unknown";

/** Next.js router variants */
export type NextJsVariant = "next-app-router" | "next-pages-router";

/**
 * Framework information detected from project
 */
export interface FrameworkInfo {
  /** Framework identifier */
  name: FrameworkName;
  /** Next.js router variant (app or pages) */
  variant?: NextJsVariant;
  /** Display name for user-facing messages */
  displayName: string;
  /** Prefix required for client-side env vars, or null if none needed */
  envPrefix: string | null;
}

/**
 * TypeScript configuration information
 */
export interface TypeScriptInfo {
  /** Whether project uses TypeScript */
  isTypeScript: boolean;
  /** Path to tsconfig.json if it exists */
  configPath: string | null;
  /** Whether strict mode is enabled (null if tsconfig doesn't specify) */
  strict: boolean | null;
}

/**
 * Project directory structure information
 */
export interface ProjectStructure {
  /** Whether project has a src/ directory */
  hasSrcDir: boolean;
  /** Path to src/ directory if it exists */
  srcPath: string | null;
  /** Path to app/ directory (Next.js App Router) */
  appDirPath: string | null;
  /** Path to pages/ directory (Next.js Pages Router) */
  pagesDirPath: string | null;
  /** All components/ directories found in project */
  componentsDirs: string[];
  /** Path to root layout file based on framework */
  rootLayoutPath: string | null;
}

/**
 * React Context provider detected in codebase
 */
export interface ProviderInfo {
  /** Provider name (e.g., 'ThemeProvider', 'AuthProvider') */
  name: string;
  /** Import source (e.g., '@/contexts/theme', 'next-themes') */
  importSource: string;
  /** File path where provider is used */
  filePath: string;
  /** How deeply nested (0 = root level) */
  nestingLevel: number;
}

/**
 * React component detected in codebase
 */
export interface ComponentInfo {
  /** Component name */
  name: string;
  /** File path where component is defined */
  filePath: string;
  /** Whether component is exported */
  isExported: boolean;
  /** Whether component accepts props */
  hasProps: boolean;
  /** Name of props interface if defined */
  propsInterface?: string;
  /** React hooks used by this component */
  hooks: string[];
  /** JSDoc description if available */
  description?: string;
}

/**
 * Function or API call that could become a Tambo tool
 */
export interface ToolCandidate {
  /** Function or tool name */
  name: string;
  /** File path where tool candidate is defined */
  filePath: string;
  /** Type of tool candidate */
  type: "fetch" | "axios" | "server-action" | "exported-function";
  /** Description extracted from JSDoc if available */
  description?: string;
}

/**
 * Complete project analysis result
 */
export interface ProjectAnalysis {
  /** Detected framework information */
  framework: FrameworkInfo;
  /** Project directory structure */
  structure: ProjectStructure;
  /** TypeScript configuration */
  typescript: TypeScriptInfo;
  /** Package manager in use */
  packageManager: string;
  /** Detected React Context providers */
  providers: ProviderInfo[];
  /** Detected React components */
  components: ComponentInfo[];
  /** Functions/API calls that could become tools */
  toolCandidates: ToolCandidate[];
}
