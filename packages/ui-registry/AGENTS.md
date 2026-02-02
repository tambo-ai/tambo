# AGENTS.md

Detailed guidance for Claude Code agents working with the ui-registry package.

## Project Overview

The `@tambo-ai/ui-registry` package is the single source of truth for all Tambo UI components. This internal package contains React components that are:

1. Copied to the CLI at build time for distribution to users
2. Used directly by showcase and docs during development

## Essential Commands

```bash
# Development
npm run lint -w packages/ui-registry       # ESLint code checking
npm run lint:fix -w packages/ui-registry   # Fix lint issues
npm run check-types -w packages/ui-registry # TypeScript type checking
npm run test -w packages/ui-registry        # Run component tests
npm run verify-exports -w packages/ui-registry # Validate package.json exports
```

## CI Verification

The `verify-exports` script validates that `package.json` exports match the filesystem:

- All exports point to files that exist
- All component directories have a corresponding export

This runs automatically before lint via turbo.json. If you add a new component and forget to add its export, CI will fail.

## Architecture Overview

### Directory Structure

```
packages/ui-registry/
├── src/
│   ├── components/     # UI components (each has config.json + source files)
│   │   ├── message/
│   │   │   ├── config.json
│   │   │   ├── message.tsx
│   │   │   ├── message-content.test.tsx  # Tests live alongside components
│   │   │   └── index.tsx
│   │   └── ...
│   ├── lib/            # Shared utilities (thread-hooks, etc.)
│   ├── styles/         # CSS files (globals-v3.css, globals-v4.css)
│   └── utils.ts        # Utility functions (cn, etc.)
├── __tests__/
│   ├── setup.ts                    # Jest setup file
│   ├── html-snapshot-serializer.ts # Snapshot formatting
│   └── __mocks__/                  # Jest mocks
│       ├── @tambo-ai-react.ts      # Mock for @tambo-ai/react
│       ├── styleMock.js            # Mock for CSS imports
│       └── react-media-recorder.ts # Mock for react-media-recorder
├── jest.config.ts
├── package.json
└── tsconfig.json
```

### Component Structure

Each component directory contains:

- `config.json` - Metadata (name, description, dependencies, files)
- `*.tsx` files - React component source
- `*.test.tsx` files - Jest tests (alongside components)
- `index.tsx` - Public exports

## Package Relationships

**Data Flow:**

1. Components are authored here in `src/components/`
2. At CLI build time, `cli/scripts/copy-registry.ts` copies them to `cli/dist/registry/`
3. Users run `tambo add <component>` which reads from `cli/dist/registry/`

**Build Dependencies:**

- `turbo.json` configures `tambo#build` to watch this package's source files
- Changes here invalidate CLI's build cache automatically
- Showcase and docs import directly (no copy step)

## Testing

### Test File Layout

Tests live alongside the components they test:

- `src/components/message/message.tsx` → `src/components/message/message-content.test.tsx`
- `src/components/thread-dropdown/thread-dropdown.tsx` → `src/components/thread-dropdown/thread-dropdown.test.tsx`

### Running Tests

```bash
npm test -w packages/ui-registry                  # Run all component tests
npm test -w packages/ui-registry -- --watch      # Run tests in watch mode
npm test -w packages/ui-registry -- thread-dropdown # Run specific component test
```

### Writing Component Tests

Components use `@testing-library/react` with jsdom and a shared Jest mock for `@tambo-ai/react`:

- The default mock implementation lives in `__tests__/__mocks__/@tambo-ai-react.ts`
- The mock is auto-applied via `moduleNameMapper` in `jest.config.ts`
- Use `jest.mocked()` for type-safe mock access when you need to override behavior

Example:

```tsx
/// <reference types="@testing-library/jest-dom" />
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import React from "react";
import { render } from "@testing-library/react";
import { ComponentName } from "./component-name";
import { useTambo } from "@tambo-ai/react";

// @tambo-ai/react is mocked via moduleNameMapper in jest.config.ts

describe("ComponentName", () => {
  const mockUseTambo = jest.mocked(useTambo);

  beforeEach(() => {
    mockUseTambo.mockReturnValue({
      thread: {
        messages: [],
        generationStage: "IDLE",
      },
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

## Development Patterns

### Adding New Components

1. Create component directory in `src/components/`
2. Add `config.json` with metadata
3. Include component files (`.tsx`)
4. Add exports to `package.json`
5. Write tests alongside the component
6. Rebuild CLI (`npm run build -w cli`) to copy new components

### Modifying Components

1. Edit the component source in `src/components/`
2. Run tests: `npm test -w packages/ui-registry`
3. The CLI will pick up changes on next build

## Gotchas

- **Add exports for new components**: New component directories must be added to `package.json` exports field. The `verify-exports` script will catch this in CI.
- **Don't edit `cli/dist/registry/`**: Those files are copied from here at build time and will be overwritten.
- **Rebuild CLI after changes**: Run `npm run build -w cli` to copy updated components to the CLI's dist folder.

## Important Development Rules

- All components must be SSR compatible
- Components should accept and apply `className` prop
- Use Tailwind CSS for styling
- Follow existing patterns for component structure
- Write tests for new components
- Always run tests before committing: `npm test -w packages/ui-registry`
