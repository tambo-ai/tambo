# Renaming from Hydra to Tambo

This document outlines the steps required to rename the project from Hydra to Tambo.

## To DO

- [ ] Version of this for hydra-ai react package
- [ ] How to move the original doc site to a new path (keeps old references)

## Prerequisites

Before running the rename scripts:

1. Publish the new `@tambo-ai` packages to npm
2. Update all package.json files to use the new published versions
3. Ensure you have committed or stashed any pending changes

## Running the Rename Scripts

1. Run the content update script:

```bash
npm run rename-to-tambo
```

This will:

- Update file contents (variable names, imports, etc.)
- Rename files and directories
- Preserve words like "hydrate", "hydration", etc.

## Post-Rename Steps

1. Clean all node_modules:

```bash
rm -rf node_modules packages/*/node_modules apps/*/node_modules
```

2. Install dependencies:

```bash
npm install
```

3. Run linting to verify changes:

```bash
npm run lint
```

4. Run type checking:

```bash
npm run check-types
```

## What Gets Renamed

The scripts handle the following patterns:

- Package names (e.g., `@use-hydra-ai/core` → `@tambo/core`)
- Component names (e.g., `HydraClient` → `TamboClient`)
- Variable/hook names (e.g., `useHydraState` → `useTamboState`)
- File/directory names (e.g., `hydra-config.ts` → `tambo-config.ts`)
- Environment variables (e.g., `HYDRA_API_KEY` → `TAMBO_API_KEY`)
- URLs and domains (e.g., `usehydra.ai` → `tambo.co`)

## Preserved Terms

The following terms are preserved and not renamed:

- hydrate
- hydration

## Troubleshooting

If you encounter issues:

1. Package resolution errors:
   - Ensure new packages are published to npm
   - Update package.json dependencies to use correct versions
   - Clean and reinstall node_modules

2. Linting errors:
   - Run `npm run lint:fix`
   - Check eslint configs are properly linked

3. Type errors:
   - Run `npm run check-types`
   - Update any missed type references
