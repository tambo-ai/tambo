# AGENTS.md

Detailed guidance for Claude Code agents working with the CLI package.

## Project Overview

The Tambo CLI (`tambo`) is a command-line tool for scaffolding, managing, and extending Tambo AI applications. It provides component generation, project initialization, dependency management, and development utilities.

## Component Registry (Source of Truth)

The `/cli/src/registry/` is the single source of truth for all Tambo components. Components auto-sync to showcase - edit only in CLI registry, never in showcase (files are auto-generated and will be overwritten).

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

- **Registry**: `src/registry/` - Template components that auto-sync to showcase and get copied to user projects via `tambo add`
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

The CLI package has two types of tests with different layouts:

### Test File Layout

**Registry Component Tests** (React/shadcn components):

- Location: `__tests__/registry/` mirroring the registry structure
- Example: `src/registry/thread-dropdown/thread-dropdown.tsx` → `__tests__/registry/thread-dropdown/thread-dropdown.test.tsx`
- **Rationale**: Registry components are distributed to users via npm. Tests must be in a separate directory to exclude them from the published package.

**CLI Utility Tests** (commands, utils):

- Location: Beside the file they cover
- Example: `src/commands/add/index.ts` → `src/commands/add/index.test.ts`

### Running Tests

```bash
npm test                        # Run all tests
npm test -- --watch            # Run tests in watch mode
npm test -- __tests__/registry # Run only registry component tests
npm test -- thread-dropdown    # Run specific component test
npm test -- add                # Run specific CLI utility test
```

### Writing Registry Component Tests

Registry components use `@testing-library/react` with jsdom and a shared Jest
mock for `@tambo-ai/react`:

- The default mock implementation lives in
  `__tests__/__mocks__/@tambo-ai-react.ts`.
- In tests, call `jest.mock("@tambo-ai/react")` once at the top of the file.
- Cast the exported hooks to `jest.MockedFunction<typeof useTambo>` (etc) when
  you need to override behavior for a specific scenario.

Example:

```tsx
import { render } from "@testing-library/react";
import { ComponentName } from "@/components/tambo/component-name";
import { useTambo } from "@tambo-ai/react";

jest.mock("@tambo-ai/react");

describe("ComponentName", () => {
  const mockUseTambo = useTambo as jest.MockedFunction<typeof useTambo>;

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      // per-test mock return value
    } as never);
  });

  it("renders correctly", () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText("Expected Text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<ComponentName className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
```

Focus on:

- Component renders without crashing
- Props are passed correctly
- Custom className is applied
- Basic user interactions work
- Error states are handled

### Writing CLI Utility Tests

CLI utilities use Jest with ESM support and memfs for filesystem mocking:

- Use `memfs` (`vol.fromJSON()`) to mock filesystem operations
- Mock external dependencies: `child_process.execSync`, `inquirer.prompt`, registry utilities
- Helper functions in `tests/helpers/mock-fs-setup.ts` for common test scenarios
- See `src/commands/list/index.test.ts` and `src/commands/add/index.test.ts` for examples

Key requirements:

- Command handlers must have unit tests
- Test both success and error cases
- Mock external dependencies (don't hit real filesystem/network/npm)

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

Keeping registry tests under `__tests__/` and using `*.test.ts(x)` along with
the `files` configuration ensures:

1. Test files are not included in the npm package
2. Registry components stay clean (no test files in the distributed components)
3. Tests don't get synced to the showcase app
4. Package size stays minimal for end users

## Important Development Rules

- CLI is built as ESM module only
- All components must be SSR compatible
- Follow existing patterns for command structure
- Write tests for new commands and logic changes
- Test component generation end-to-end
- Update help text for new commands/options
- Always run tests before committing: `npm test`
