/**
 * Type definitions for init command
 */

import type { CommandSuggestion } from "../../utils/output.js";

export interface BaseResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  filesCreated: string[];
  filesModified: string[];
}

export interface ConfigResult extends BaseResult {
  tamboTsCreated: boolean;
  tamboTsPath?: string;
  apiKeyFound: boolean;
}

export interface AgentDocsResult extends BaseResult {
  skillInstalled: boolean;
}

export interface InitResult {
  success: boolean;
  tamboReactInstalled: boolean;
  authenticated: boolean;
  projectName?: string;
  projectCreated: boolean;
  apiKeyCreated: boolean;
  envFile?: string;
  tamboTsCreated: boolean;
  tamboTsPath?: string;
  skillInstalled: boolean;
  errors: string[];
  warnings: string[];
  filesCreated: string[];
  filesModified: string[];
  packagesInstalled: string[];
  suggestedCommands: CommandSuggestion[];
}
