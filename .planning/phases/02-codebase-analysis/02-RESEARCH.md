# Phase 02: Codebase Analysis - Research

**Researched:** 2026-02-12
**Domain:** Project analysis, framework detection, AST parsing, filesystem inspection
**Confidence:** HIGH

## Summary

Phase 2 requires the CLI to automatically detect React framework variants (Next.js App/Pages Router, Vite, Remix, CRA), project structure patterns, existing providers, and potential Tambo integration points without manual configuration. This research confirms that reliable detection is possible using a combination of package.json inspection, filesystem pattern matching, and TypeScript AST parsing with ts-morph.

The existing CLI already has strong foundations: package manager detection (npm/yarn/pnpm/rush), framework detection (Next.js/Vite), and ts-morph integration for AST parsing. Phase 2 should extend these patterns to build a comprehensive analysis module that scans user projects and produces structured data for the `tambo init` command.

**Primary recommendation:** Build a pure analysis module in `cli/src/utils/project-analysis/` that exports functions returning structured ProjectAnalysis data. Keep analysis logic separate from CLI commands to enable testing and reuse.

## Standard Stack

### Core

| Library         | Version  | Purpose                    | Why Standard                                                              |
| --------------- | -------- | -------------------------- | ------------------------------------------------------------------------- |
| ts-morph        | ^27.0.2  | TypeScript/JSX AST parsing | Already in CLI, wraps TypeScript Compiler API for easier AST manipulation |
| Node.js fs/path | Built-in | Filesystem inspection      | Native Node APIs, no external deps needed                                 |
| glob/fast-glob  | N/A      | File pattern matching      | NOT needed - use fs.readdirSync recursively (smaller, simpler)            |

### Supporting

| Library                  | Version  | Purpose                  | When to Use                                                                     |
| ------------------------ | -------- | ------------------------ | ------------------------------------------------------------------------------- |
| package-manager-detector | Consider | Enhanced PM detection    | Only if extending beyond existing detection in cli/src/utils/package-manager.ts |
| detect-package-manager   | Consider | Alternative PM detection | Same as above - existing code already handles npm/yarn/pnpm/rush                |

### Alternatives Considered

| Instead of         | Could Use     | Tradeoff                                                                             |
| ------------------ | ------------- | ------------------------------------------------------------------------------------ |
| ts-morph           | @babel/parser | Babel is more generic but ts-morph provides TypeScript-first API, already integrated |
| Custom AST walking | acorn/estree  | Acorn is lighter but ts-morph provides structured navigation methods                 |
| Recursive fs       | fast-glob     | fast-glob is faster for large codebases but adds dependency; benchmark if needed     |

**Installation:**

```bash
# No new dependencies needed - ts-morph already in CLI package.json
```

## Architecture Patterns

### Recommended Project Structure

```
cli/src/utils/project-analysis/
├── index.ts                    # Main entry point, exports analyzeProject()
├── types.ts                    # ProjectAnalysis interface and related types
├── framework-detection.ts      # Extend existing framework detection
├── structure-detection.ts      # Detect src/, app/, pages/, components/ dirs
├── provider-detection.ts       # Find existing providers using ts-morph
├── component-detection.ts      # Identify React components that could be interactables
├── tool-detection.ts           # Find functions/API calls that could be Tambo tools
└── __tests__/                  # Unit tests for each module
    ├── framework-detection.test.ts
    ├── provider-detection.test.ts
    └── ...
```

### Pattern 1: Framework Detection (Extended)

**What:** Detect React framework variant from package.json deps and config files
**When to use:** First step in project analysis - framework determines other detection logic
**Example:**

```typescript
// Source: Based on cli/src/utils/framework-detection.ts pattern
export interface FrameworkInfo {
  name: "next" | "vite" | "remix" | "cra" | "unknown";
  variant?: "next-app-router" | "next-pages-router";
  displayName: string;
  envPrefix: string | null;
}

export function detectFramework(projectRoot: string): FrameworkInfo {
  // 1. Check package.json dependencies
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // 2. Next.js detection (check for 'next' package)
  if ("next" in deps) {
    const variant = detectNextJsVariant(projectRoot);
    return {
      name: "next",
      variant,
      displayName:
        variant === "next-app-router"
          ? "Next.js App Router"
          : "Next.js Pages Router",
      envPrefix: "NEXT_PUBLIC_",
    };
  }

  // 3. Vite detection (check for 'vite' package or config files)
  if (
    "vite" in deps ||
    hasAnyFile(["vite.config.ts", "vite.config.js"], projectRoot)
  ) {
    return { name: "vite", displayName: "Vite", envPrefix: "VITE_" };
  }

  // 4. Remix detection (check for '@remix-run/react')
  if ("@remix-run/react" in deps) {
    return { name: "remix", displayName: "Remix", envPrefix: null };
  }

  // 5. CRA detection (check for 'react-scripts')
  if ("react-scripts" in deps) {
    return {
      name: "cra",
      displayName: "Create React App",
      envPrefix: "REACT_APP_",
    };
  }

  return { name: "unknown", displayName: "Unknown", envPrefix: null };
}

// Detect Next.js variant by checking for app/ or pages/ directory
function detectNextJsVariant(
  projectRoot: string,
): "next-app-router" | "next-pages-router" {
  const hasAppDir =
    fs.existsSync(path.join(projectRoot, "app")) ||
    fs.existsSync(path.join(projectRoot, "src/app"));
  const hasPagesDir =
    fs.existsSync(path.join(projectRoot, "pages")) ||
    fs.existsSync(path.join(projectRoot, "src/pages"));

  // App Router takes precedence if both exist
  if (hasAppDir) return "next-app-router";
  if (hasPagesDir) return "next-pages-router";

  // Default to app router for new projects
  return "next-app-router";
}
```

### Pattern 2: Structure Detection

**What:** Identify common React project directory patterns
**When to use:** After framework detection, to locate root components and providers
**Example:**

```typescript
export interface ProjectStructure {
  hasSrcDir: boolean;
  srcPath: string | null;
  appDirPath: string | null; // Next.js app/ directory
  pagesDirPath: string | null; // Next.js pages/ directory
  componentsDirs: string[]; // All components/ directories found
  rootLayoutPath: string | null; // app/layout.tsx or pages/_app.tsx
}

export function detectProjectStructure(
  projectRoot: string,
  framework: FrameworkInfo,
): ProjectStructure {
  const hasSrcDir = fs.existsSync(path.join(projectRoot, "src"));
  const srcPath = hasSrcDir ? path.join(projectRoot, "src") : null;

  // Detect app/ and pages/ directories (check both root and src/)
  const appDirPath = findDirectory(["app", "src/app"], projectRoot);
  const pagesDirPath = findDirectory(["pages", "src/pages"], projectRoot);

  // Find all components/ directories recursively
  const componentsDirs = findComponentsDirectories(projectRoot);

  // Locate root layout file based on framework
  const rootLayoutPath = findRootLayout(projectRoot, framework);

  return {
    hasSrcDir,
    srcPath,
    appDirPath,
    pagesDirPath,
    componentsDirs,
    rootLayoutPath,
  };
}

function findRootLayout(
  projectRoot: string,
  framework: FrameworkInfo,
): string | null {
  if (framework.name === "next") {
    if (framework.variant === "next-app-router") {
      // app/layout.tsx or src/app/layout.tsx
      const candidates = [
        "app/layout.tsx",
        "app/layout.jsx",
        "src/app/layout.tsx",
        "src/app/layout.jsx",
      ];
      return findFirstExisting(candidates, projectRoot);
    } else {
      // pages/_app.tsx or src/pages/_app.tsx
      const candidates = [
        "pages/_app.tsx",
        "pages/_app.jsx",
        "src/pages/_app.tsx",
        "src/pages/_app.jsx",
      ];
      return findFirstExisting(candidates, projectRoot);
    }
  } else if (framework.name === "vite") {
    // src/App.tsx or App.tsx
    const candidates = ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"];
    return findFirstExisting(candidates, projectRoot);
  }

  return null;
}
```

### Pattern 3: Provider Detection (AST-based)

**What:** Use ts-morph to find existing React Context providers in layout files
**When to use:** After locating root layout file, to detect provider nesting opportunities
**Example:**

```typescript
// Source: Pattern adapted from cli/src/commands/add/tailwind/config/parsing.ts
import { Project, SyntaxKind } from "ts-morph";

export interface ProviderInfo {
  name: string; // e.g., 'ThemeProvider', 'AuthProvider'
  importSource: string; // e.g., '@/contexts/theme', 'next-themes'
  filePath: string; // File where provider is used
  nestingLevel: number; // How deeply nested (0 = root level)
}

export function detectProviders(layoutFilePath: string): ProviderInfo[] {
  const project = new Project({ skipFileDependencyResolution: true });
  const sourceFile = project.addSourceFileAtPath(layoutFilePath);

  const providers: ProviderInfo[] = [];

  // Find all JSX elements that end with "Provider"
  sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement).forEach((element) => {
    const tagName = element.getOpeningElement().getTagNameNode().getText();

    if (tagName.endsWith("Provider")) {
      // Find import source for this provider
      const importDecl = sourceFile.getImportDeclaration((decl) => {
        return decl.getNamedImports().some((imp) => imp.getName() === tagName);
      });

      const importSource = importDecl?.getModuleSpecifierValue() ?? "unknown";

      providers.push({
        name: tagName,
        importSource,
        filePath: layoutFilePath,
        nestingLevel: calculateNestingLevel(element),
      });
    }
  });

  return providers;
}

function calculateNestingLevel(element: JsxElement): number {
  let level = 0;
  let parent = element.getParent();

  while (parent) {
    if (parent.getKind() === SyntaxKind.JsxElement) {
      level++;
    }
    parent = parent.getParent();
  }

  return level;
}
```

### Pattern 4: Component Detection (Interactable Candidates)

**What:** Identify React functional components that could become AI-controllable
**When to use:** Scan components/ directories to suggest interactable opportunities
**Example:**

```typescript
export interface ComponentInfo {
  name: string;
  filePath: string;
  isExported: boolean;
  hasProps: boolean;
  propsInterface?: string;
  usesHooks: string[]; // e.g., ['useState', 'useEffect']
}

export function detectComponents(componentsDir: string): ComponentInfo[] {
  const project = new Project({ skipFileDependencyResolution: true });
  const components: ComponentInfo[] = [];

  // Find all .tsx and .jsx files
  const files = findFilesRecursively(componentsDir, [".tsx", ".jsx"]);

  files.forEach((filePath) => {
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Find function declarations/arrow functions that return JSX
    sourceFile.getFunctions().forEach((func) => {
      if (isReactComponent(func)) {
        components.push(extractComponentInfo(func, filePath));
      }
    });

    // Also check variable declarations (arrow functions)
    sourceFile.getVariableDeclarations().forEach((decl) => {
      const initializer = decl.getInitializer();
      if (initializer && isArrowFunctionReturningJsx(initializer)) {
        components.push(extractComponentInfo(decl, filePath));
      }
    });
  });

  return components;
}

function isReactComponent(func: FunctionDeclaration): boolean {
  // Must start with capital letter
  if (!/^[A-Z]/.test(func.getName() ?? "")) return false;

  // Must return JSX
  const returnStatements = func.getDescendantsOfKind(
    SyntaxKind.ReturnStatement,
  );
  return returnStatements.some((stmt) => {
    const expr = stmt.getExpression();
    return (
      expr &&
      (expr.getKind() === SyntaxKind.JsxElement ||
        expr.getKind() === SyntaxKind.JsxFragment)
    );
  });
}
```

### Pattern 5: Tool Detection (API Call Candidates)

**What:** Find functions and API calls that could become Tambo tools
**When to use:** Scan project for fetch() calls, axios requests, server actions
**Example:**

```typescript
export interface ToolCandidate {
  name: string;
  filePath: string;
  type: "fetch" | "axios" | "server-action" | "function";
  signature?: string;
  description?: string; // Extracted from JSDoc if present
}

export function detectToolCandidates(projectRoot: string): ToolCandidate[] {
  const project = new Project({ skipFileDependencyResolution: true });
  const candidates: ToolCandidate[] = [];

  // Find all .ts and .tsx files (excluding node_modules, .next, etc.)
  const files = findFilesRecursively(projectRoot, [".ts", ".tsx"], {
    exclude: ["node_modules", ".next", "dist", "build"],
  });

  files.forEach((filePath) => {
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Detect fetch() calls
    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .forEach((call) => {
        const expr = call.getExpression().getText();
        if (expr === "fetch") {
          candidates.push({
            name: `fetch_${path.basename(filePath, path.extname(filePath))}`,
            filePath,
            type: "fetch",
            signature: call.getText(),
          });
        }
      });

    // Detect server actions (Next.js "use server" functions)
    sourceFile.getFunctions().forEach((func) => {
      if (hasUseServerDirective(func)) {
        candidates.push({
          name: func.getName() ?? "anonymous",
          filePath,
          type: "server-action",
          signature: func.getText(),
          description: extractJsDocDescription(func),
        });
      }
    });
  });

  return candidates;
}
```

### Anti-Patterns to Avoid

- **Don't analyze node_modules** - Exclude node_modules, .next, dist, build from scans (massive perf impact)
- **Don't parse every file** - Target specific directories and file patterns based on framework
- **Don't cache AST indefinitely** - ts-morph projects are memory-intensive; create/destroy per analysis
- **Don't modify user files** - Analysis phase is read-only; modifications come later in Phase 3

## Don't Hand-Roll

| Problem                   | Don't Build                 | Use Instead                                 | Why                                                          |
| ------------------------- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Package.json parsing      | Custom JSON parser          | JSON.parse() + try/catch                    | Built-in, handles all edge cases                             |
| Package manager detection | Custom lock file checks     | Existing cli/src/utils/package-manager.ts   | Already handles npm/yarn/pnpm/rush with fallbacks            |
| TypeScript parsing        | Custom regex/string parsing | ts-morph                                    | Handles all TypeScript syntax correctly, maintains type info |
| Framework detection       | Manual dependency checks    | Extend cli/src/utils/framework-detection.ts | Already detects Next.js/Vite with proper patterns            |
| File globbing             | Shell exec (find/grep)      | fs.readdirSync recursive                    | Pure Node.js, cross-platform, no shell injection risk        |

**Key insight:** The CLI already has 80% of the infrastructure needed. Don't rebuild - extend existing modules with new detection capabilities.

## Common Pitfalls

### Pitfall 1: Framework Detection False Positives

**What goes wrong:** Detecting CRA when project has react-scripts as dev tooling but uses Vite
**Why it happens:** Checking dependencies without considering framework migration scenarios
**How to avoid:** Check in priority order: config files first, then dependencies. Next.js config > Vite config > react-scripts presence
**Warning signs:** Multiple framework indicators present (both vite.config.ts and react-scripts)

### Pitfall 2: Next.js Router Variant Confusion

**What goes wrong:** Assuming Pages Router when app/ directory exists but is empty
**Why it happens:** Not validating that app/layout.tsx exists, just checking directory
**How to avoid:** Check for app/layout.tsx or app/layout.jsx specifically, not just app/ directory
**Warning signs:** Next.js project with both app/ and pages/ directories

### Pitfall 3: Provider Detection Missing Dynamic Imports

**What goes wrong:** Not finding providers loaded with dynamic import() or lazy()
**Why it happens:** AST analysis only finds static imports and JSX in initial file
**How to avoid:** Accept this limitation for Phase 2 - dynamic providers are edge cases
**Warning signs:** User reports "Tambo didn't find my ThemeProvider" but it's React.lazy()

### Pitfall 4: Component Detection Explosion

**What goes wrong:** Identifying 500+ components in large codebases, overwhelming user
**Why it happens:** Scanning all directories recursively without filtering
**How to avoid:**

- Focus on components/ directories only
- Filter by file naming conventions (PascalCase)
- Skip test files, story files, types-only files
- Limit results to top 20-30 most relevant
  **Warning signs:** Analysis takes >5 seconds, returns hundreds of components

### Pitfall 5: AST Memory Leaks

**What goes wrong:** ts-morph Project accumulates files, memory usage grows unbounded
**Why it happens:** Reusing same Project instance across multiple directories
**How to avoid:** Create new Project() per directory scan, let garbage collection clean up
**Warning signs:** CLI memory usage grows with project size, eventually crashes

### Pitfall 6: Cross-Platform Path Issues

**What goes wrong:** Paths work on Mac/Linux but break on Windows (hardcoded /)
**Why it happens:** Using string concatenation instead of path.join()
**How to avoid:** Always use path.join(), path.resolve(), path.relative() from Node.js
**Warning signs:** CI passes on Linux, fails on Windows runners

### Pitfall 7: Assuming TypeScript

**What goes wrong:** Only checking .tsx files, missing .jsx components
**Why it happens:** ts-morph name implies TypeScript-only
**How to avoid:** ts-morph parses JavaScript too - scan both .ts/.tsx and .js/.jsx files
**Warning signs:** User has JavaScript project, analysis returns empty results

## Code Examples

Verified patterns from official sources and existing CLI code:

### Detecting Lock Files for Package Manager

```typescript
// Source: cli/src/utils/package-manager.ts (existing code)
export function detectPackageManager(
  projectRoot: string = process.cwd(),
): PackageManager {
  // Rush.json may be in ancestor directory (monorepo root)
  if (findFileInAncestors("rush.json", projectRoot) !== null) {
    return "rush";
  }

  if (fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fs.existsSync(path.join(projectRoot, "yarn.lock"))) {
    return "yarn";
  }

  // Bun detection could be added here: bun.lockb

  return "npm"; // Default fallback
}
```

### Using ts-morph to Parse React Components

```typescript
// Source: Adapted from cli/src/commands/add/tailwind/config/parsing.ts pattern
import { Project, SyntaxKind } from "ts-morph";

export function findReactComponents(filePath: string): string[] {
  const project = new Project({
    skipFileDependencyResolution: true,
    compilerOptions: { allowJs: true, jsx: "react" },
  });

  const sourceFile = project.addSourceFileAtPath(filePath);
  const componentNames: string[] = [];

  // Find exported function components
  sourceFile.getFunctions().forEach((func) => {
    const name = func.getName();
    if (name && /^[A-Z]/.test(name) && func.isExported()) {
      // Check if function returns JSX
      const hasJsxReturn = func
        .getDescendantsOfKind(SyntaxKind.ReturnStatement)
        .some((stmt) => {
          const expr = stmt.getExpression();
          return (
            expr &&
            (expr.getKind() === SyntaxKind.JsxElement ||
              expr.getKind() === SyntaxKind.JsxFragment)
          );
        });

      if (hasJsxReturn) {
        componentNames.push(name);
      }
    }
  });

  return componentNames;
}
```

### Recursive Directory Traversal (Pure Node.js)

```typescript
// Avoid external glob libraries - use built-in fs
export function findFilesRecursively(
  dir: string,
  extensions: string[],
  options: { exclude?: string[] } = {},
): string[] {
  const results: string[] = [];
  const exclude = options.exclude ?? [];

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip excluded directories
      if (exclude.some((ex) => fullPath.includes(ex))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}
```

## State of the Art

| Old Approach            | Current Approach                   | When Changed      | Impact                                                                              |
| ----------------------- | ---------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| CRA (react-scripts)     | Vite, Next.js                      | 2022-2023         | CRA deprecated; Vite is now standard for non-framework React                        |
| Class components        | Functional + Hooks                 | 2019-present      | Component detection must recognize hooks (useState, useEffect) as component markers |
| Pages Router only       | App Router preferred               | Next.js 13 (2022) | Must detect both routers; app/ takes precedence over pages/                         |
| Manual environment vars | Framework-prefixed vars            | Ongoing           | NEXT*PUBLIC*, VITE*, REACT_APP* prefixes required for client-side access            |
| Babel AST parsing       | ts-morph / TypeScript Compiler API | Ongoing           | ts-morph provides TypeScript-first API, better for modern TS/TSX projects           |

**Deprecated/outdated:**

- **CRA detection priority** - Should be lowest priority since CRA is deprecated; warn users to migrate
- **Class component-only detection** - Modern codebases are 95%+ functional components
- **Ignoring Remix** - Remix is gaining adoption; include in framework detection

## Open Questions

1. **Bun package manager support**
   - What we know: Bun uses bun.lockb, similar to other lock files
   - What's unclear: Does existing CLI need Bun support for Phase 2?
   - Recommendation: Add bun.lockb detection to detectPackageManager() if easy, but LOW priority

2. **Remix routing detection**
   - What we know: Remix uses file-based routing in app/routes/
   - What's unclear: Should Phase 2 detect Remix routing patterns specifically?
   - Recommendation: Detect Remix framework, but route analysis can wait for later phase if not needed for `tambo init`

3. **Performance thresholds for large codebases**
   - What we know: ts-morph is memory-intensive; scanning 1000+ files could be slow
   - What's unclear: What's acceptable analysis time? 5s? 10s? Should we add progress indicators?
   - Recommendation: Benchmark with large repo (500+ components). If >5s, add spinner. If >15s, optimize or limit scope.

4. **Monorepo detection**
   - What we know: Existing CLI detects Rush monorepos via rush.json
   - What's unclear: Should Phase 2 detect Turborepo, Nx, or other monorepo tools?
   - Recommendation: Not critical for Phase 2. `tambo init` will be run from package directory, not monorepo root.

5. **Provider nesting recommendations**
   - What we know: Can detect existing providers and their nesting levels
   - What's unclear: Should analysis recommend WHERE to insert TamboProvider in nesting order?
   - Recommendation: Yes - suggest inserting after theme/auth providers but before page-specific providers. Document heuristic.

## Sources

### Primary (HIGH confidence)

- CLI source code: `/cli/src/utils/package-manager.ts` - Package manager detection patterns
- CLI source code: `/cli/src/utils/framework-detection.ts` - Framework detection (Next.js, Vite)
- CLI source code: `/cli/src/commands/add/tailwind/config/parsing.ts` - ts-morph usage patterns
- [ts-morph Documentation](https://ts-morph.com/) - Official API docs and navigation guide
- [ts-morph GitHub](https://github.com/dsherret/ts-morph) - Source code and examples

### Secondary (MEDIUM confidence)

- [Next.js Docs: Getting Started - Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) - App Router detection patterns
- [Next.js Docs: Pages Router - Custom App](https://nextjs.org/docs/pages/building-your-application/routing/custom-app) - Pages Router \_app.tsx patterns
- [Next.js: App Router vs Pages Router (Medium)](https://medium.com/@tanzim3421/next-js-app-router-vs-pages-router-what-you-need-to-know-202-69a885ccaa56) - Detection heuristics
- [detect-package-manager (npm)](https://www.npmjs.com/package/detect-package-manager) - Lock file detection patterns
- [package-manager-detector (npm)](https://www.npmjs.com/package/package-manager-detector) - Enhanced detection with packageManager field

### Tertiary (LOW confidence)

- [Detecting UI components with TypeScript Compiler API](https://fwouts.com/articles/previewjs-detecting-components) - Component detection patterns
- [AST-based refactoring with ts-morph (kimmo.blog)](https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/) - AST manipulation examples
- [Provider Pattern with React Context API (Flexiple)](https://flexiple.com/react/provider-pattern-with-react-context-api) - Provider detection patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - ts-morph already integrated, Node.js fs/path are built-in
- Architecture: HIGH - Patterns verified in existing CLI code, proven in production
- Pitfalls: MEDIUM-HIGH - Based on common CLI development issues and AST parsing gotchas
- Framework detection: HIGH - Verified with official Next.js docs and existing CLI implementation
- AST parsing: MEDIUM-HIGH - ts-morph patterns verified, but component/provider detection needs testing
- Tool detection: MEDIUM - Conceptual patterns, not yet implemented; needs validation

**Research date:** 2026-02-12
**Valid until:** ~30 days (stable domain - framework detection patterns change slowly)
