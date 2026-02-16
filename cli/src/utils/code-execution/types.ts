/**
 * Type definitions for code execution module
 *
 * These types support the execution flow where installation plans
 * are transformed into file system operations and dependency installations.
 */

import type { InstallationPlan } from "../plan-generation/types.js";
import type { ConfirmationResult } from "../user-confirmation/types.js";

/**
 * Represents a single file operation (create or modify)
 */
export interface FileOperation {
  /** Absolute path to the file */
  filePath: string;

  /** Content to write to the file */
  content: string;

  /** Whether this is a new file (true) or modifying existing (false) */
  isNew: boolean;
}

/**
 * Manifest tracking backed up files for potential rollback
 */
export interface BackupManifest {
  /** Map of original file path to backup file path */
  backups: Map<string, string>;

  /** Timestamp when backup was created (used in backup filenames) */
  timestamp: string;
}

/**
 * Set of dependencies to install
 */
export interface DependencySet {
  /** Production dependencies */
  dependencies: string[];

  /** Development dependencies */
  devDependencies: string[];
}

/**
 * Verification error found during pre-execution checks
 */
export interface VerificationError {
  /** File path where issue was found */
  filePath: string;

  /** Description of the issue */
  issue: string;

  /** Suggested fix */
  suggestion: string;
}

/**
 * Execution error with phase context
 */
export interface ExecutionError {
  /** Which phase failed */
  phase: "file-write" | "dependency-install" | "verification";

  /** File path where error occurred (if applicable) */
  filePath?: string;

  /** Root cause of the error */
  cause: string;

  /** Suggested fixes */
  suggestions: string[];
}

/**
 * Result of executing an installation plan
 */
export interface ExecutionResult {
  /** Whether execution completed successfully */
  success: boolean;

  /** Paths of files created */
  filesCreated: string[];

  /** Paths of files modified */
  filesModified: string[];

  /** List of dependencies installed */
  dependenciesInstalled: string[];

  /** Verification errors (non-fatal warnings) */
  errors: VerificationError[];
}

// Re-export for convenience
export type { InstallationPlan, ConfirmationResult };
