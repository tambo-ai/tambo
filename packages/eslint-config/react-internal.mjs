import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { createRequire } from "node:module";
import process from "node:process";
import tseslint from "typescript-eslint";
import baseConfig from "./base.mjs";

const requireFromCwd = createRequire(`${process.cwd()}/package.json`);
const eslintMajorVersion = Number.parseInt(
  requireFromCwd("eslint/package.json").version.split(".")[0] ?? "0",
  10,
);
const installedReactVersion = (() => {
  try {
    return requireFromCwd("react/package.json").version;
  } catch {
    return "999.999.999";
  }
})();
const reactConfigVersion =
  eslintMajorVersion >= 10 ? installedReactVersion : "detect";

/**
 * A custom ESLint configuration for libraries that use React.
 */
export default tseslint.config(
  ...baseConfig,
  js.configs.recommended,
  // @ts-expect-error types don't match
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: reactConfigVersion } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react-hooks/exhaustive-deps": "error",
    },
  },
);
