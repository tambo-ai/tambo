import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node22",
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  platform: "node",
  // Bundle tambo/* imports, keep all npm packages external
  noExternal: [/tambo\/.*/],
  esbuildOptions(options) {
    options.alias = {
      "tambo/lib": "../cli/src/lib",
      "tambo/commands": "../cli/src/commands",
      "tambo/utils": "../cli/src/utils",
      "tambo/constants": "../cli/src/constants",
      "tambo/templates": "../cli/src/templates",
    };
    // Mark all packages as external - they'll be resolved from node_modules at runtime
    options.packages = "external";
  },
});
