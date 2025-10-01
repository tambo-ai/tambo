# AGENTS.md

Detailed guidance for Claude Code agents working with the CLI package.

## Project Overview

The Tambo CLI (`tambo`) is a command-line tool for scaffolding, managing, and extending Tambo AI applications. It provides component generation, project initialization, dependency management, and development utilities.

## Essential Commands

```bash
# Development
npm run dev              # Watch mode TypeScript compilation
npm run build           # Build CLI executable
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

- **Registry**: `src/registry/` - Template components with metadata
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

### New End User Features Process

We have a doc-first approach to developing new features in our CLI. This means we write the documentation first, and then write the code to implement the feature. Our docs are in the docs site (Read Docs/AGENTS.md)

1. Read all the existing documentation and code in the repository.
2. Read the relevant code to ensure you understand the existing code and the context.
3. Before writing any code, write a detailed description of the feature in the docs site.
4. Then write the code to implement the feature.

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

## Important Development Rules

- CLI is built as ESM module only
- All components must be SSR compatible
- Follow existing patterns for command structure
- Test component generation end-to-end
- Update help text for new commands/options
