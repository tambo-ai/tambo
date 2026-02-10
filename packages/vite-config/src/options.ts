export const DEFAULT_OPTIONS: Partial<Options> = {
  srcDir: "./src",
  outDir: "dist",
  enableCjs: true,
} as const;

export type Options = {
  /**
   * Entry file(s) for the build
   */
  entry: string | string[];
  /**
   * Source directory for the project
   * @default './src'
   */
  srcDir?: string;
  /**
   * Files or patterns to exclude from the build
   */
  exclude?: string[];
  /**
   * Output directory for the build
   * @default 'dist'
   */
  outDir?: string;
  /**
   * Enable CommonJS build output
   * @default true
   */
  enableCjs?: boolean;
  /**
   * packages to exclude from the bundle and treat as external dependencies
   */
  externalDeps?: string[];
  /**
   * packages to explicitly include in the bundle. This will normally happen automatically for
   * dependencies that are not listed in externalDeps.
   */
  bundledDeps?: string[];
  /**
   * Path to the tsconfig.json file
   */
  tsconfigPath?: string;
};

export function resolveOptions(options: Options) {
  if (!options.entry) {
    throw new Error("The 'entry' option is required.");
  }

  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}
