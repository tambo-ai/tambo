import fs from "fs";
import path from "path";
import type { SourceFile } from "ts-morph";
import { Project, SyntaxKind } from "ts-morph";
import { findFilesRecursively } from "./fs-helpers.js";
import type { ToolCandidate } from "./types.js";

/**
 * Options for detectToolCandidates
 */
interface DetectToolCandidatesOptions {
  /** Directories to exclude from search (in addition to defaults) */
  exclude?: string[];
}

/**
 * File extensions to scan for tool candidates
 */
const TOOL_EXTENSIONS = [".ts", ".tsx"];

/**
 * Additional exclusions for tool detection beyond fs-helpers defaults
 */
const TOOL_EXCLUDE_PATTERNS = [".test.", ".spec.", ".stories.", ".d.ts"];

/**
 * Maximum file size to process (50KB)
 */
const MAX_FILE_SIZE = 50 * 1024;

/**
 * Maximum number of tool candidates to return
 */
const MAX_CANDIDATES = 30;

/**
 * Extracts JSDoc description from a function declaration or expression
 *
 * @param node - The function node to extract JSDoc from
 * @returns The description text, or undefined if no JSDoc exists
 */
function extractJsDocDescription(node: {
  getJsDocs(): { getDescription(): string }[];
}): string | undefined {
  const jsDocs = node.getJsDocs();
  if (jsDocs.length === 0) {
    return undefined;
  }

  const description = jsDocs[0]?.getDescription().trim();
  return description || undefined;
}

/**
 * Checks if a function appears to be a React component
 *
 * @param name - Function name
 * @param sourceFile - Source file containing the function
 * @returns True if function is likely a React component
 */
function isReactComponent(name: string, sourceFile: SourceFile): boolean {
  // Check if name starts with uppercase (component naming convention)
  const firstChar = name[0];
  if (!firstChar || firstChar.toLowerCase() === firstChar) {
    return false;
  }

  // Check if function returns JSX
  const functionDecl = sourceFile.getFunction(name);
  if (functionDecl) {
    const returnStatements = functionDecl.getDescendantsOfKind(
      SyntaxKind.ReturnStatement,
    );
    for (const ret of returnStatements) {
      const expr = ret.getExpression();
      if (
        expr?.getKind() === SyntaxKind.JsxElement ||
        expr?.getKind() === SyntaxKind.JsxFragment ||
        expr?.getKind() === SyntaxKind.JsxSelfClosingElement
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects server actions in a source file
 *
 * @param sourceFile - Source file to scan
 * @param filePath - Absolute path to the file
 * @returns Array of server action tool candidates
 */
function detectServerActions(
  sourceFile: SourceFile,
  filePath: string,
): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  // Check for top-level "use server" directive
  const hasTopLevelDirective = sourceFile
    .getStatements()
    .some(
      (stmt) =>
        stmt.getKind() === SyntaxKind.ExpressionStatement &&
        stmt.getText().includes('"use server"'),
    );

  if (hasTopLevelDirective) {
    // All exported functions in this file are server actions
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (func.isExported() && func.getName()) {
        const name = func.getName()!;
        candidates.push({
          name,
          filePath,
          type: "server-action",
          description: extractJsDocDescription(func),
        });
      }
    }
  } else {
    // Check for function-level "use server" directives
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      const funcBody = func.getBody();
      if (funcBody && func.getName()) {
        // Check if the body is a block statement
        const block = funcBody.asKind(SyntaxKind.Block);
        if (!block) {
          continue;
        }
        const statements = block.getStatements();
        const hasDirective = statements.some(
          (stmt) =>
            stmt.getKind() === SyntaxKind.ExpressionStatement &&
            stmt.getText().includes('"use server"'),
        );

        if (hasDirective) {
          const name = func.getName()!;
          candidates.push({
            name,
            filePath,
            type: "server-action",
            description: extractJsDocDescription(func),
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Detects exported functions that call fetch or axios
 *
 * @param sourceFile - Source file to scan
 * @param filePath - Absolute path to the file
 * @returns Array of fetch/axios tool candidates
 */
function detectFetchCalls(
  sourceFile: SourceFile,
  filePath: string,
): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];
  const functions = sourceFile.getFunctions();

  for (const func of functions) {
    if (!func.isExported() || !func.getName()) {
      continue;
    }

    const name = func.getName()!;

    // Skip React components
    if (isReactComponent(name, sourceFile)) {
      continue;
    }

    // Check for fetch() calls
    const callExpressions = func.getDescendantsOfKind(
      SyntaxKind.CallExpression,
    );
    for (const call of callExpressions) {
      const expr = call.getExpression();
      const callText = expr.getText();

      if (callText === "fetch") {
        candidates.push({
          name,
          filePath,
          type: "fetch",
          description: extractJsDocDescription(func),
        });
        break; // Only add once per function
      }

      // Check for axios.* calls (axios.get, axios.post, etc.)
      if (callText.startsWith("axios.")) {
        candidates.push({
          name,
          filePath,
          type: "axios",
          description: extractJsDocDescription(func),
        });
        break;
      }
    }
  }

  return candidates;
}

/**
 * Detects exported async functions that could be tool candidates
 *
 * @param sourceFile - Source file to scan
 * @param filePath - Absolute path to the file
 * @returns Array of exported-function tool candidates
 */
function detectExportedAsyncFunctions(
  sourceFile: SourceFile,
  filePath: string,
): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];
  const functions = sourceFile.getFunctions();

  for (const func of functions) {
    if (!func.isExported() || !func.getName() || !func.isAsync()) {
      continue;
    }

    const name = func.getName()!;

    // Skip React components
    if (isReactComponent(name, sourceFile)) {
      continue;
    }

    candidates.push({
      name,
      filePath,
      type: "exported-function",
      description: extractJsDocDescription(func),
    });
  }

  return candidates;
}

/**
 * Processes a batch of files to detect tool candidates
 *
 * @param files - Array of file paths to process
 * @returns Array of tool candidates found in the files
 */
function processBatch(files: string[]): ToolCandidate[] {
  const candidates: ToolCandidate[] = [];

  // Create a new ts-morph Project for this batch
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      jsx: 1, // Preserve JSX
    },
    skipFileDependencyResolution: true,
  });

  for (const filePath of files) {
    // Skip files that are too large
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > MAX_FILE_SIZE) {
        continue;
      }
    } catch {
      continue;
    }

    try {
      const sourceFile = project.addSourceFileAtPath(filePath);

      // Detect different types of tool candidates
      const serverActions = detectServerActions(sourceFile, filePath);
      const fetchCalls = detectFetchCalls(sourceFile, filePath);
      const exportedFunctions = detectExportedAsyncFunctions(
        sourceFile,
        filePath,
      );

      // Deduplicate: prefer server-action type over exported-function
      const serverActionNames = new Set(serverActions.map((c) => c.name));

      candidates.push(...serverActions);
      candidates.push(...fetchCalls);
      candidates.push(
        ...exportedFunctions.filter((c) => !serverActionNames.has(c.name)),
      );
    } catch {
      // Skip files that can't be parsed
      continue;
    }
  }

  return candidates;
}

/**
 * Detects functions and API calls that could become Tambo tools
 *
 * Scans the project for:
 * - Server actions (Next.js "use server" functions)
 * - Exported functions that call fetch() or axios
 * - Exported async functions (general tool candidates)
 *
 * Excludes React components and test files.
 *
 * @param projectRoot - Root directory of the project to scan
 * @param options - Optional configuration
 * @returns Array of tool candidates (max 30, sorted by file path and name)
 */
export function detectToolCandidates(
  projectRoot: string,
  options: DetectToolCandidatesOptions = {},
): ToolCandidate[] {
  const excludePatterns = [...(options.exclude ?? [])];

  // Find all TypeScript/TSX files
  const files = findFilesRecursively(projectRoot, TOOL_EXTENSIONS, {
    exclude: excludePatterns,
  });

  // Filter out test/spec/stories files
  const sourceFiles = files.filter((file) => {
    const basename = path.basename(file);
    return !TOOL_EXCLUDE_PATTERNS.some((pattern) => basename.includes(pattern));
  });

  // Process files in batches (group by directory to optimize ts-morph memory usage)
  const filesByDir = new Map<string, string[]>();
  for (const file of sourceFiles) {
    const dir = path.dirname(file);
    const files = filesByDir.get(dir) ?? [];
    files.push(file);
    filesByDir.set(dir, files);
  }

  const allCandidates: ToolCandidate[] = [];
  for (const files of filesByDir.values()) {
    const batchCandidates = processBatch(files);
    allCandidates.push(...batchCandidates);
  }

  // Deduplicate by (name, filePath) combination
  const seen = new Set<string>();
  const uniqueCandidates = allCandidates.filter((c) => {
    const key = `${c.name}:${c.filePath}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // Sort by file path, then name
  uniqueCandidates.sort((a, b) => {
    const pathCompare = a.filePath.localeCompare(b.filePath);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return a.name.localeCompare(b.name);
  });

  // Cap at MAX_CANDIDATES
  return uniqueCandidates.slice(0, MAX_CANDIDATES);
}
