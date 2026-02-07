import { preserveDirectives } from "rollup-plugin-preserve-directives";
import type { UserConfig } from "vite";
import { defineConfig } from "vite";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import tsconfigPaths from "vite-tsconfig-paths";
import { Options, resolveOptions } from "./options";
import { tamboDtsPlugin } from "./plugins/tamboDtsPlugin";

/**
 * Takes care of common Vite build configuration like preserving directives, externalizing dependencies, and generating
 * esm/cjs builds, as well as type declarations for Tambo packages.
 * @param options Options for configuring the Vite build
 * @returns Valid Vite UserConfig
 */
export const tamboViteConfig = (options: Options): UserConfig => {
  const resolvedOptions = resolveOptions(options);
  const { entry, externalDeps, bundledDeps, tsconfigPath, enableCjs, outDir } =
    resolvedOptions;

  return defineConfig({
    plugins: [
      externalizeDeps({
        include: externalDeps ?? [],
        except: bundledDeps ?? [],
      }),
      // Preserve 'use client' directives, etc.
      preserveDirectives(),
      tsconfigPaths({
        projects: tsconfigPath ? [tsconfigPath] : undefined,
      }),
      tamboDtsPlugin(resolvedOptions),
    ],
    build: {
      outDir,
      minify: false,
      sourcemap: true,
      lib: {
        entry,
        formats: enableCjs ? ["es", "cjs"] : ["es"],
        fileName: (format) =>
          format === "cjs" ? "cjs/[name].cjs" : "esm/[name].js",
      },
      rollupOptions: {
        output: {
          preserveModules: true,
        },
      },
    },
  });
};
