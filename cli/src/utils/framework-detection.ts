import fs from "fs";
import path from "path";

export interface FrameworkDetection {
  framework:
    | "nextjs"
    | "vite"
    | "cra"
    | "remix"
    | "astro"
    | "sveltekit"
    | "nuxt"
    | "unknown";
  envPrefix: string;
}

interface FrameworkConfig {
  configFiles?: string[];
  packageNames?: string[];
  envPrefix: string;
}

const FRAMEWORK_CONFIGS: Record<
  Exclude<FrameworkDetection["framework"], "unknown">,
  FrameworkConfig
> = {
  nextjs: {
    configFiles: ["next.config.js", "next.config.mjs", "next.config.ts"],
    packageNames: ["next"],
    envPrefix: "NEXT_PUBLIC_",
  },
  vite: {
    configFiles: ["vite.config.js", "vite.config.ts", "vite.config.mjs"],
    packageNames: ["vite"],
    envPrefix: "VITE_",
  },
  cra: {
    packageNames: ["react-scripts"],
    envPrefix: "REACT_APP_",
  },
  remix: {
    configFiles: ["remix.config.js", "remix.config.ts"],
    packageNames: ["@remix-run/react"],
    envPrefix: "",
  },
  astro: {
    configFiles: ["astro.config.mjs", "astro.config.js"],
    packageNames: ["astro"],
    envPrefix: "PUBLIC_",
  },
  sveltekit: {
    configFiles: ["svelte.config.js"],
    packageNames: ["@sveltejs/kit"],
    envPrefix: "PUBLIC_",
  },
  nuxt: {
    configFiles: ["nuxt.config.js", "nuxt.config.ts"],
    packageNames: ["nuxt"],
    envPrefix: "NUXT_PUBLIC_",
  },
};

/**
 * Detects the JavaScript framework used in a project to determine the correct
 * environment variable prefix.
 *
 * Detection strategy:
 * 1. Check for framework-specific config files (highest priority)
 * 2. Check package.json dependencies
 * 3. Return "unknown" with empty prefix as fallback
 *
 * @param projectRoot - The root directory of the project
 * @returns Framework detection result with framework name and env prefix
 *
 * @example
 * const { framework, envPrefix } = detectFramework(process.cwd());
 * // For Next.js: { framework: "nextjs", envPrefix: "NEXT_PUBLIC_" }
 * // For unknown: { framework: "unknown", envPrefix: "" }
 */
export function detectFramework(projectRoot: string): FrameworkDetection {
  // Phase 1: Check for framework-specific config files
  for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
    if (config.configFiles) {
      for (const configFile of config.configFiles) {
        const configPath = path.join(projectRoot, configFile);
        if (fs.existsSync(configPath)) {
          return {
            framework: framework as Exclude<
              FrameworkDetection["framework"],
              "unknown"
            >,
            envPrefix: config.envPrefix,
          };
        }
      }
    }
  }

  // Phase 2: Check package.json dependencies
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
        if (config.packageNames) {
          for (const packageName of config.packageNames) {
            if (allDeps[packageName]) {
              return {
                framework: framework as Exclude<
                  FrameworkDetection["framework"],
                  "unknown"
                >,
                envPrefix: config.envPrefix,
              };
            }
          }
        }
      }
    } catch (_error) {
      // Failed to read or parse package.json, continue to fallback
    }
  }

  // Phase 3: Default fallback
  return {
    framework: "unknown",
    envPrefix: "",
  };
}
