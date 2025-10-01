# AGENTS.md

Detailed guidance for Claude Code agents working with the create-tambo-app package.

## Project Overview

The `create-tambo-app` package is a lightweight bootstrapper that creates new Tambo AI applications. It acts as a proxy to the latest version of the `tambo` CLI's `create-app` command.

## Essential Commands

```bash
# Development
npm run dev          # Watch mode TypeScript compilation
npm run build        # Build executable
npm run lint         # ESLint code checking

# Usage (after build/publish)
npx create-tambo-app my-app    # Create new Tambo app
npm create tambo-app my-app    # Alternative syntax
```

## Architecture Overview

### Proxy Pattern

The package implements a simple proxy pattern:

1. Receives command-line arguments
2. Delegates to `npx tambo@latest create-app` with those arguments
3. Ensures users always get the latest CLI version

### Single Entry Point

- **`src/index.ts`** - Entire package implementation
- Uses Node.js `spawn` to execute `tambo` CLI
- Inherits stdio for seamless user experience
- Exits with same code as underlying process

## Key Features

- **Always Latest**: Uses `npx tambo@latest` to ensure latest CLI
- **Argument Passthrough**: All arguments passed to underlying CLI
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **No Dependencies**: Minimal package with no runtime dependencies

## Development Patterns

### Modifying Behavior

Since this is a simple proxy, most functionality changes should be made in the main `tambo` CLI's `create-app` command rather than here.

### Testing

Test the built package locally:

```bash
npm run build
node dist/index.js my-test-app
```

## Important Development Rules

- Keep this package minimal and focused
- All logic should be in the main `tambo` CLI
- Maintain compatibility with npm's `create-*` conventions
- Test cross-platform compatibility
- Ensure proper exit code handling
