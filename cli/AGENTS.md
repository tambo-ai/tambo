# AGENTS.md

Detailed guidance for Claude Code agents working with the CLI package.

## Project Overview

The Tambo CLI (`tambo`) is a command-line tool for scaffolding, managing, and extending Tambo AI applications. It provides component generation, project initialization, dependency management, and development utilities.

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

- **Registry**: `src/registry/` - Template components with metadata. These
  components are copied into a user's project when they run the `tambo add`
  command. Any changes to the component files should be made in this package first,
  and then duplicated into the showcase/ and docs/ packages.
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
- `src/registry/` - Component templates and configurations
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

1. Create component directory in `src/registry/`
2. Add `config.json` with metadata
3. Include component files and dependencies
4. Test installation and generation

## Testing

### Test Structure

- Tests are located in `tests/` directory (separate from `src/` to avoid distribution)
- Uses Jest with ESM support and memfs for filesystem mocking
- Test files follow pattern: `tests/commands/*.test.ts`

### Running Tests

```bash
npm test                 # Run all tests
npm test -- --watch     # Run tests in watch mode
npm test -- list        # Run specific test file
```

### Writing Tests

Tests use memfs to mock the filesystem without affecting the real filesystem:

```typescript
import { vol } from "memfs";

// Setup mock filesystem
vol.fromJSON({
  "/mock-project/package.json": JSON.stringify({ name: "test" }),
  "/mock-project/src/components/tambo/message.tsx":
    "export const message = () => null;",
});

// Test your command
await handleListComponents();

// Clean up
vol.reset();
```

Key testing utilities in `tests/helpers/mock-fs-setup.ts`:

- `createBasicProjectStructure()` - Creates common test filesystem structures
- `captureConsoleOutput()` - Captures console.log output for assertions
- `mockProcessCwd()` - Mocks the current working directory

### Test Coverage

- Command handlers should have unit tests
- Use mock filesystem to simulate project structures
- Mock external dependencies (registry, network calls)
- Test both success and error cases

## Important Development Rules

- CLI is built as ESM module only
- All components must be SSR compatible
- Follow existing patterns for command structure
- Write tests for new commands and logic changes
- Test component generation end-to-end
- Update help text for new commands/options
- Always run tests before committing: `npm test`
