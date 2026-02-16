# Testing Patterns

**Analysis Date:** 2026-02-11

## Test Framework

**Runner:**

- Jest 30.2.0
- Config files: `jest.config.ts` in each package
- Transform: `ts-jest` with preset

**Assertion Library:**

- Jest built-in matchers (expect)
- Testing Library (`@testing-library/react` 16.3.2) for component testing

**Run Commands:**

```bash
npm test                      # Run all tests across workspace
npm test -- --watch          # Watch mode
npm test -- [pattern]        # Run tests matching pattern
npm run test:cov             # Generate coverage report
```

**Test Environment:**

- React SDK and web apps: `jsdom` (browser simulation)
- CLI and backend packages: `node` (default)

## Test File Organization

**Location Pattern:**

- Unit tests: co-located beside the file they test (same directory)
- Integration tests: `__tests__/` directories at package root
- Test fixtures and mocks: `__fixtures__/` or `__mocks__` at package source root

**Naming Convention:**

- All test files end with `.test.ts` or `.test.tsx`
- Never use `.spec.ts` or other suffixes
- Test names describe the scenario tested
- Example: `dependency-resolution.test.ts`, `use-tambo-provider.test.tsx`

**Structure Example (React SDK):**

```
react-sdk/src/
├── hooks/
│   ├── use-tambo.tsx
│   ├── use-tambo.test.tsx          # Co-located unit test
│   └── react-query-hooks.ts
├── __tests__/
│   └── integration.test.tsx         # Integration tests
├── __mocks__/
│   └── mock-client.ts              # Shared mocks
└── __fixtures__/
    └── test-data.ts                # Shared fixtures
```

**Test Structure:**

- Use `describe()` blocks to group related tests
- Use `it()` to define individual test cases
- Use `beforeEach()`/`afterEach()` for setup and teardown
- Create fresh state (e.g., new QueryClient) in `beforeEach()`
- Always clean up in `afterEach()` (restore mocks, close modules)

## Test Structure

**Describe Block Organization:**

```typescript
describe("ComponentName", () => {
  // Setup shared mocks/fixtures
  let testClient: QueryClient;

  beforeEach(() => {
    // Create fresh instances for each test
    testClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe("specific behavior", () => {
    it("should do something", () => {
      // Arrange
      const input = "test";

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

**Suite Organization:**

- Group tests by functionality/behavior (not by type)
- Use nested `describe()` blocks to organize related tests
- Example: describe hook behavior, then edge cases, then error cases separately

## Mocking

**Framework:**

- Jest mocks for modules: `jest.mock()`
- Spies for functions: `jest.spyOn()`
- Memfs for filesystem mocking in CLI tests
- Custom mock factories for common patterns

**Mocking Pattern (Module Mocks):**

```typescript
import { jest } from "@jest/globals";

// Mock before imports
jest.unstable_mockModule("../utils.js", () => ({
  getComponentPath: jest.fn((name: string) => `/path/${name}`),
}));

// Import after mocking
const { getComponentPath } = await import("../utils.js");
```

**Mocking Pattern (Jest.mock):**

```typescript
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: true,
    isError: false,
    error: null,
  })),
}));

// Then cast to access mock functions
jest.mocked(useQuery).mockReturnValue({
  data: "test",
  isLoading: false,
  isError: false,
  error: null,
});
```

**Spying Pattern:**

```typescript
beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks(); // or jest.spyOn(...).mockRestore()
});

it("should log output", () => {
  const spy = jest.spyOn(console, "log");
  myFunction();
  expect(spy).toHaveBeenCalledWith("expected");
});
```

**What to Mock:**

- External API calls and third-party services
- Database operations (use test databases or mock operations)
- File system operations (use `memfs` for filesystem mocking)
- Network requests
- Timer functions (jest.useFakeTimers / jest.useRealTimers)
- React/React Query internals only when testing behavior that depends on their internals

**What NOT to Mock:**

- Pure utility functions in the same codebase
- Validation logic
- Type helpers
- Helper functions that are fast and deterministic
- Internal business logic unless testing integration of modules

## Fixtures and Factories

**Test Data Location:**

- Shared fixtures: `__fixtures__/` directory at package root
- Package-specific fixtures: `src/__fixtures__/` within package
- Test utilities and factories: co-located with tests or in `__fixtures__/`

**Fixture Pattern (Mock Factory):**

```typescript
// src/testing/tools.ts - Shared mock factory
export function createMockTool(overrides?: Partial<TamboTool>): TamboTool {
  return {
    name: "test-tool",
    description: "Test tool",
    tool: jest.fn(),
    inputSchema: z.object({}),
    outputSchema: z.any(),
    ...overrides,
  };
}

// In test file
const tool = createMockTool({
  inputSchema: z.object({ name: z.string() }),
});
```

**Filesystem Fixture Pattern (memfs):**

```typescript
import { vol } from "memfs";
import { fs as memfsFs } from "memfs";

jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    "/project/src/file.ts": "export const x = 1;",
    "/project/package.json": JSON.stringify({ name: "test" }),
  });
});

afterEach(() => {
  vol.reset();
});
```

## Coverage

**Requirements:**

- React SDK: 82% branches, 87% lines minimum
- Config: `coverageThreshold` in `jest.config.ts`
- Generated code and test files excluded from coverage

**View Coverage:**

```bash
npm run test:cov              # Generate coverage report
# Opens coverage/lcov-report/index.html
```

**Coverage Configuration (React SDK example):**

```typescript
coverageThreshold: {
  global: {
    branches: 82,
    lines: 87,
  },
},
collectCoverageFrom: [
  "<rootDir>/src/**/*.{js,jsx,ts,tsx}",
  "!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
  "!<rootDir>/src/**/__tests__/**",
  "!<rootDir>/src/**/__mocks__/**",
  "!<rootDir>/src/setupTests.ts",
],
```

## Test Types

**Unit Tests:**

- Scope: Single function/hook/class in isolation
- Approach: Mock all external dependencies
- Location: Co-located with source file
- Example: `react-sdk/src/hooks/use-tambo.test.tsx` tests the hook behavior in isolation

**Integration Tests:**

- Scope: Multiple modules working together
- Approach: Mock at system boundaries (APIs, databases), use real implementations for module interactions
- Location: `__tests__/` directory at package root
- Example: Testing that a React hook works correctly with a provider context

**E2E Tests:**

- Framework: Supertest for backend (NestJS)
- Location: `test/` directory at package root
- Approach: Spin up full server, test endpoints with real database
- Example: `apps/api/test/app.e2e-spec.ts` tests endpoints end-to-end

## Common Patterns

**Async Testing (async/await):**

```typescript
it("should fetch user data", async () => {
  const promise = fetchUser(123);

  await expect(promise).resolves.toEqual({ id: 123, name: "John" });
});

it("should reject on invalid ID", async () => {
  const promise = fetchUser(-1);

  await expect(promise).rejects.toThrow("Invalid ID");
});
```

**Error Testing:**

```typescript
it("should throw on missing required field", () => {
  expect(() => {
    functionThatThrows({});
  }).toThrow("Required field missing");

  // or with async
  await expect(asyncFunctionThatThrows()).rejects.toThrow(
    "Required field missing",
  );
});

// Testing HttpException responses
it("should return 400 for invalid input", async () => {
  try {
    await controller.someMethod(invalidDto);
    fail("Should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.getResponse()).toEqual({
      statusCode: 400,
      message: "Invalid input",
      error: "Bad Request",
    });
  }
});
```

**React Hook Testing:**

```typescript
import { renderHook, act } from "@testing-library/react";

it("should update state", () => {
  const { result } = renderHook(() => useTambo(), {
    wrapper: ({ children }) => <TamboProvider>{children}</TamboProvider>,
  });

  act(() => {
    result.current.updateState(newValue);
  });

  expect(result.current.state).toBe(newValue);
});

it("should handle async operations", async () => {
  const { result } = renderHook(() => useFetchData(), {
    wrapper: QueryClientProvider,
  });

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toEqual(expectedData);
});
```

**React Component Testing (Testing Library):**

```typescript
import { render, screen, fireEvent } from "@testing-library/react";

it("should render button and handle click", () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  const button = screen.getByRole("button", { name: /click me/i });
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**NestJS Module Testing:**

```typescript
import { Test, TestingModule } from "@nestjs/testing";

describe("AppService", () => {
  let service: AppService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should have getHello method", () => {
    expect(service.getHello()).toBe("Welcome");
  });
});
```

**Query Client Setup (React SDK):**

```typescript
// Create fresh QueryClient for each test to avoid cache pollution
beforeEach(() => {
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },        // Disable retries in tests
      mutations: { retry: false },
    },
  });
});

// Wrap components/hooks with QueryClientProvider
const wrapper = ({ children }) => (
  <QueryClientProvider client={testQueryClient}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useQuery(...), { wrapper });
```

## Pre-commit & PR Verification

**Before Opening a PR, Run:**

```bash
npm run check-types    # TypeScript type checking across workspace
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm test               # Run unit and integration tests
```

**CI will also run:**

- Full linting (without auto-fix)
- Type checking
- All tests
- Coverage thresholds

## Special Test Patterns

**Testing Streaming Responses (React SDK):**

- Mock streaming utilities and test prop updates
- Verify content streams character by character
- Use mock timers or real async handlers

**Testing MCP Integration:**

- Mock MCP client and server instances
- Test tool discovery and execution paths
- Verify resource access and streaming

**CLI Testing with memfs:**

- Use `memfs.vol.fromJSON()` for virtual filesystem
- Mock child_process for command execution
- Restore `process.cwd` after each test
- Use spy on console.log to capture output

---

_Testing analysis: 2026-02-11_
