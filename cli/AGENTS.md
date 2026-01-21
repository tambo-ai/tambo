# AGENTS.md

Detailed guidance for Claude Code agents working with the CLI package.

## Project Overview

The Tambo CLI (`tambo`) is a command-line tool for scaffolding, managing, and extending Tambo AI applications. It provides component generation, project initialization, dependency management, and development utilities.

## Component Registry (Source of Truth)

The component registry lives in `packages/ui-registry/` - this is the single source of truth for all Tambo components. The CLI copies these components to `dist/registry/` at build time via the `copy-registry` prebuild script. When users run `tambo add <component>`, files are read from `dist/registry/` and transformed for the user's project.

## Essential Commands

```bash
# Development
npm run dev              # Watch mode TypeScript compilation
npm run build           # Build CLI executable
npm run test            # Run Jest test suite
npm run lint            # ESLint code checking
npm run check-types     # TypeScript type checking

# CLI usage (after build)
tambo init                    # Initialize Tambo in existing project
tambo add <component>        # Add components from registry
tambo list                   # List available components
tambo create-app <name>      # Create new Tambo application
tambo update                 # Update existing components
tambo upgrade               # Upgrade Tambo dependencies
```

## Architecture Overview

### Command Structure

- **Entry point**: `src/cli.ts` - Main CLI setup with meow
- **Commands**: `src/commands/` - Individual command implementations
  - `init.ts` - Project initialization
  - `add/` - Component installation system
  - `create-app.ts` - New app creation
  - `list/` - Component listing
  - `update.ts` - Component updates
  - `upgrade/` - Dependency upgrades

### Component Registry System

- **Registry Source**: `packages/ui-registry/src/` - The source of truth for all Tambo components
- **CLI Distribution**: At build time, registry is copied to `cli/dist/registry/`
- **Structure**: Each component has:
  - `config.json` - Metadata (name, description, dependencies)
  - Component files (`.tsx`, `.ts`)
  - Supporting files (CSS, utilities)

### Key Features

- Automatic dependency resolution and installation
- Tailwind CSS configuration management
- Project structure detection and setup
- Interactive prompts for user choices
- Template-based component generation

## Key Files and Directories

- `src/cli.ts` - Main CLI entry point with command routing
- `src/commands/add/` - Component installation logic
- `scripts/copy-registry.ts` - Prebuild script that copies registry from ui-registry package
- `dist/registry/` - Built registry files (copied from `packages/ui-registry/src/`)
- `src/constants/` - Shared constants and paths
- `src/templates/` - Project templates

## Development Patterns

### New End-User Features Process

We have a doc-first approach to developing new features in our CLI. This means we write the documentation first, then write the code to implement the feature. Our docs are in the docs site (read ../docs/AGENTS.md).

1. Read all existing documentation and code in the repository
2. Read the relevant code to ensure you understand the existing code and context
3. Before writing any code, write a detailed description of the feature in the docs site
4. Then write the code to implement the feature

If you do update the components directly, you should also update the documentation in the docs site (read ../docs/AGENTS.md).

### Adding New Commands

1. Create command file in `src/commands/`
2. Implement handler function
3. Add to CLI routing in `src/cli.ts`
4. Update help text and flags

### Adding New Components

1. Create component directory in `packages/ui-registry/src/components/`
2. Add `config.json` with metadata
3. Include component files and dependencies
4. Add exports to `packages/ui-registry/package.json`
5. Rebuild CLI (`npm run build -w cli`) to copy new components
6. Test installation with `tambo add <component>`

## Testing

### CLI Utility Tests

CLI utilities use Jest with ESM support and memfs for filesystem mocking:

- **Location**: Tests live beside the files they cover
- **Example**: `src/commands/add/index.ts` → `src/commands/add/index.test.ts`
- Use `memfs` (`vol.fromJSON()`) to mock filesystem operations
- Mock external dependencies: `child_process.execSync`, `inquirer.prompt`, registry utilities
- Helper functions in `src/__fixtures__/mock-fs-setup.ts` for common test scenarios
- See `src/commands/list/index.test.ts` and `src/commands/add/index.test.ts` for examples

### Running Tests

```bash
npm test                        # Run all CLI tests
npm test -- --watch            # Run tests in watch mode
npm test -- add                # Run specific CLI utility test
```

Key requirements:

- Command handlers must have unit tests
- Test both success and error cases
- Mock external dependencies (don't hit real filesystem/network/npm)

### Component Tests

Registry component tests live in `packages/ui-registry/` alongside the components they test. See `packages/ui-registry/AGENTS.md` for details on running and writing component tests.

### Package Distribution

The CLI `package.json` is configured so test files are excluded from the
published npm package:

```jsonc
"files": [
  "src",
  "dist",
  "!**/*.test.*",
  "!**/__tests__/**"
]
```

## Important Development Rules

- CLI is built as ESM module only
- All components must be SSR compatible
- Follow existing patterns for command structure
- Write tests for new commands and logic changes
- Test component generation end-to-end
- Update help text for new commands/options
- Always run tests before committing: `npm test`
