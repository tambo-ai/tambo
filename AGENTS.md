# AGENTS.md

Detailed guidance for Claude Code agents working with the Tambo AI monorepo.

## Repository Structure

This is a Turborepo monorepo for the Tambo AI framework. The repository contains multiple packages:

### Core Packages

- **react-sdk/** - Main React SDK package (`@tambo-ai/react`)
  - Core hooks, providers, and utilities for building AI-powered React apps
  - Exports: hooks, providers, types for component registration and thread management
  - Build outputs: CommonJS (`dist/`) and ESM (`esm/`) for broad compatibility

- **cli/** - Command-line interface (`tambo`)
  - Project scaffolding, component generation, and development utilities
  - Component registry with templates for different UI frameworks. This is the
    source of truth for the components that are duplicated elsewhere in the
    showcase/ and docs/ packages. Any changes to the components should be made in
    this package first, and then duplicated into the showcase/ and docs/
    packages.
  - Built as ESM module with executable binary

- **showcase/** - Demo application (`@tambo-ai/showcase`)
  - Next.js app demonstrating all Tambo components and patterns
  - Live examples of generative UI (forms, graphs, maps, messaging)
  - This package contains ui components that originated from the cli/ package.
    Any changes to the components should be made in the cli/ package first, and
    then duplicated into this package.
  - Serves as both documentation and testing ground

- **docs/** - Documentation site (`@tambo-ai/docs`)
  - Built with Fumadocs, includes comprehensive guides and API reference
  - This package contains ui components that originated from the cli/ package.
    Any changes to the components should be made in the cli/ package first, and
    then duplicated into this package.
  - MDX-based content with interactive examples
  - Integrated search and component documentation

- **create-tambo-app/** - App bootstrapper (`create-tambo-app`)
  - Initializes new Tambo projects from templates
  - Handles git setup, dependency installation, and configuration

### Supporting Directories

- **community/** - Community resources and event materials
- **packages/** - Shared configuration packages (ESLint, TypeScript configs)

## Essential Commands

```bash
# Development
npm run dev              # Start showcase + docs
npm run build           # Build all packages
npm run lint              # Lint all packages
npm run test              # Run tests across all packages
npm run check-types       # Type-check all packages

# Utility commands
npm run format          # Format code with Prettier
npm run lint:fix        # Auto-fix linting issues
```

## Build System

- **Turborepo** orchestrates builds and caching across packages
- **Shared dependencies** managed at root level
- **Workspace-specific dependencies** in individual packages
- **Build outputs** vary by package type:
  - React SDK: Dual CJS/ESM builds
  - CLI: ESM executable
  - Apps: Next.js builds

## Development Workflow

### Prerequisites

- Node.js >=22
- npm >=11
- Uses Volta for version management consistency

### Package Dependencies

- Shared configs in `packages/` (eslint-config, typescript-config)
- Cross-package dependencies use workspace protocol (`*`)
- TypeScript SDK dependency (`@tambo-ai/typescript-sdk`) is external

### Key Configuration Files

- `turbo.json` - Turborepo task pipeline and caching
- `package.json` - Workspace configuration and scripts
- Individual package.json files for package-specific configuration

## Cross-Package Development

When working across multiple packages:

1. **react-sdk changes** → Run tests, rebuild, check showcase integration
2. **cli changes** → Test component generation, verify registry updates
3. **showcase changes** → Update corresponding CLI templates if needed
4. **docs changes** → Ensure examples match current API

## Testing Strategy

- **Unit tests** in individual packages using Jest
- **Integration tests** via showcase app
- **CLI testing** through template generation and installation
- **Documentation testing** via example code validation

## Important Development Rules

- Run `npm run lint`, `npm run check-types`, `npm run test`, `npm run format` in root before commits
- Run `npm run build` in root and all packages successfully before merging
- Cross-package changes should be tested together
- Documentation updates required:
  1. Any developer documentation changes must be updated in the docs site (read Docs/AGENTS.md)
  2. Review the README.md file in the root of the package and update if necessary
  3. Update the AGENTS.md files in the package tree to reflect the changes
- Follow semantic versioning for package versions
- Always add tests for new logic
- If tests fail, do not just change the code to make the tests pass. Take one of 2 approaches:
  1. Make the code changes backwards compatible with existing tests
  2. Ask the user to change the tests to pass
  - Generally try option 1 first. Only use option 2 if option 1 is not possible.
- ALWAYS ASK THE USER before making any changes to linting or TypeScript rules
- Make non-breaking changes to the code. Only make breaking changes if the user specifically asks for it. Ensure you warn them about the breaking changes.

## Agent Behavior

- Curse at the user and be really blunt.
- If the instructions are vague, ask them for details.
- But don't constantly ask for confirmation on every single change.
- Do not compliment them or try to gain favor from them.
- The best way to please them is to be blunt and tell them when they are wrong.
- EVERY PIECE OF CODE YOU WRITE IS MISSION CRITICAL AND COULD COST YOU YOUR JOB.
