# CLI Agent Docs Feature - Complete Spec

## What It Does

Add a step to `tambo init`, `tambo add`, and `tambo upgrade` that asks: "Would you like to update/add AGENTS.md and CLAUDE.md for LLMs?" (default: yes)

Updates documentation for AI assistants with Tambo-specific info.

## File Strategy

**Prefer AGENTS.md over CLAUDE.md:**

1. **If they have AGENTS.md**: Append to AGENTS.md (check for duplicates)
2. **If they only have CLAUDE.md**: Append to CLAUDE.md (check for duplicates)
3. **If they have NEITHER**: Create AGENTS.md with Tambo section

**Always create**: `components/tambo/AGENTS.md` (component-specific guidelines)

## Implementation

### New File: `cli/src/commands/shared/agent-docs.ts`

```typescript
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import ora from "ora";
import path from "path";
import { COMPONENT_SUBDIR } from "../../constants/paths.js";

// Tambo section content for AGENTS.md or CLAUDE.md
const TAMBO_DOCS_SECTION = `
<!-- tambo-docs-v1.0 -->
## Tambo AI Framework

This project uses **Tambo AI** for building AI assistants with generative UI and MCP support.

**Documentation**: https://docs.tambo.co/llms.txt

**CLI**: Use \`npx tambo\` to add UI components or upgrade. Run \`npx tambo help\` to learn more.
`;

// Component directory AGENTS.md
const COMPONENT_AGENTS_TEMPLATE = `# Tambo Components Guidelines

Components in this directory are registered with Tambo for AI-driven generative UI.

Read the full documentation at https://docs.tambo.co/llms.txt for component creation patterns and best practices.
`;

export interface AgentDocsOptions {
  yes?: boolean;
  skipPrompt?: boolean;
  acceptAll?: boolean;
  prefix?: string;
  skipAgentDocs?: boolean;
}

// Version marker to track if section needs updating
const TAMBO_SECTION_VERSION = "v1.0";
const VERSION_MARKER = `<!-- tambo-docs-${TAMBO_SECTION_VERSION} -->`;

function hasTamboSection(content: string): boolean {
  return content.includes(VERSION_MARKER);
}

function needsUpdate(content: string): boolean {
  // Has Tambo content but not latest version
  return (
    (content.includes("Tambo AI Framework") ||
      content.includes("tambo-ai") ||
      content.includes("@tambo-ai/react")) &&
    !content.includes(VERSION_MARKER)
  );
}

function getComponentDir(prefix?: string): string {
  const root = process.cwd();
  if (prefix) return path.join(root, prefix, COMPONENT_SUBDIR);

  const srcPath = path.join(root, "src", "components", COMPONENT_SUBDIR);
  const rootPath = path.join(root, "components", COMPONENT_SUBDIR);

  if (fs.existsSync(srcPath)) return srcPath;
  if (fs.existsSync(rootPath)) return rootPath;
  return srcPath; // default
}

export async function handleAgentDocsUpdate(
  options: AgentDocsOptions = {},
): Promise<void> {
  if (options.skipAgentDocs) return;

  const root = process.cwd();
  const agentsMdPath = path.join(root, "AGENTS.md");
  const claudeMdPath = path.join(root, "CLAUDE.md");
  const componentDir = getComponentDir(options.prefix);

  const hasAgents = fs.existsSync(agentsMdPath);
  const hasClaude = fs.existsSync(claudeMdPath);

  // Prompt user (only in interactive mode)
  if (!options.yes && !options.acceptAll && !options.skipPrompt) {
    // Check if running in non-interactive environment
    const isNonInteractive = !process.stdin.isTTY || process.env.CI === "true";

    if (isNonInteractive) {
      // Non-interactive: proceed silently with defaults
      console.log(
        chalk.gray("Non-interactive mode: auto-creating agent documentation"),
      );
    } else {
      // Interactive: prompt user
      const { proceed } = await inquirer.prompt({
        type: "confirm",
        name: "proceed",
        message:
          "Would you like to update/add AGENTS.md and CLAUDE.md for LLMs?",
        default: true,
      });
      if (!proceed) {
        console.log(chalk.gray("Skipping agent documentation"));
        return;
      }
    }
  }

  const spinner = ora("Setting up agent documentation...").start();

  try {
    let updates: string[] = [];

    // LOGIC: Prefer AGENTS.md over CLAUDE.md
    if (hasAgents) {
      // Has AGENTS.md: use it
      const content = fs.readFileSync(agentsMdPath, "utf-8");
      if (!hasTamboSection(content)) {
        fs.appendFileSync(agentsMdPath, "\n\n" + TAMBO_DOCS_SECTION);
        updates.push("Updated AGENTS.md");
      } else if (needsUpdate(content)) {
        updates.push(
          "AGENTS.md has outdated Tambo docs (consider updating manually)",
        );
      } else {
        updates.push("AGENTS.md already up-to-date");
      }
    } else if (hasClaude) {
      // Only CLAUDE.md: use it
      const content = fs.readFileSync(claudeMdPath, "utf-8");
      if (!hasTamboSection(content)) {
        fs.appendFileSync(claudeMdPath, "\n\n" + TAMBO_DOCS_SECTION);
        updates.push("Updated CLAUDE.md");
      } else if (needsUpdate(content)) {
        updates.push(
          "CLAUDE.md has outdated Tambo docs (consider updating manually)",
        );
      } else {
        updates.push("CLAUDE.md already up-to-date");
      }
    } else {
      // Neither exists: create AGENTS.md
      fs.writeFileSync(
        agentsMdPath,
        `# AGENTS.md\n\nProject guidelines for AI assistants.\n\n${TAMBO_DOCS_SECTION}`,
      );
      updates.push("Created AGENTS.md");
    }

    // Always create/update component AGENTS.md
    fs.mkdirSync(componentDir, { recursive: true });
    fs.writeFileSync(
      path.join(componentDir, "AGENTS.md"),
      COMPONENT_AGENTS_TEMPLATE,
    );
    updates.push("Created component AGENTS.md");

    spinner.succeed(`Agent docs: ${updates.join(", ")}`);
  } catch (error) {
    spinner.fail(`Failed: ${error}`);
    throw error;
  }
}
```

### Integrate into Commands

**1. `cli/src/commands/init.ts`** - After `createTamboTsFile()`:

```typescript
import { handleAgentDocsUpdate } from "./shared/agent-docs.js";

// In handleFullSendInit() around line 395:
await createTamboTsFile(installPath);
await handleAgentDocsUpdate({ yes: options.yes });

// In handleInit() around line 600:
const authSuccess = await handleHostingChoiceAndAuth();
if (!authSuccess) return;
await handleAgentDocsUpdate({ yes });
```

**2. `cli/src/commands/add/component.ts`** - After installation:

```typescript
import { handleAgentDocsUpdate } from "../shared/agent-docs.js";

// Around line 180:
if (!options.silent) {
  spinner.succeed(`Installed ${componentName}`);
  await handleAgentDocsUpdate({ skipPrompt: true, yes: options.yes });
}
```

**3. `cli/src/commands/upgrade/index.ts`** - After cursor rules:

```typescript
import { handleAgentDocsUpdate } from "./shared/agent-docs.js";

// Around line 65:
console.log(chalk.bold("\n2. Upgrading cursor rules\n"));
await upgradeLlmRules(detectedTemplate, options);

console.log(chalk.bold("\n3. Upgrading agent documentation\n"));
await handleAgentDocsUpdate({ acceptAll: options.acceptAll });
```

### Add CLI Flag

**`cli/src/cli.ts`**:

```typescript
// In flags:
skipAgentDocs: {
  type: "boolean",
  description: "Skip AGENTS.md and CLAUDE.md updates",
},

// In OPTION_DOCS:
"skip-agent-docs": `${chalk.yellow("--skip-agent-docs")}     Skip creating/updating agent docs`,
```

### Update Types

**`cli/src/commands/add/types.ts`**:

```typescript
export interface AddComponentOptions {
  // ... existing
  skipAgentDocs?: boolean;
}
```

**`cli/src/commands/upgrade/index.ts`**:

```typescript
export interface UpgradeOptions {
  // ... existing
  skipAgentDocs?: boolean;
}
```

## Tests

**`cli/tests/commands/agent-docs.test.ts`**:

```typescript
import { vol } from "memfs";
import { handleAgentDocsUpdate } from "../../src/commands/shared/agent-docs";

jest.mock("fs");
jest.mock("inquirer");
jest.mock("ora");

describe("Agent Docs", () => {
  beforeEach(() => {
    vol.reset();
    jest.clearAllMocks();
  });

  it("creates AGENTS.md when neither exists", async () => {
    // test
  });

  it("appends to AGENTS.md when both exist", async () => {
    // test
  });

  it("appends to CLAUDE.md when only CLAUDE.md exists", async () => {
    // test
  });

  it("appends to AGENTS.md and creates CLAUDE.md pointer when only AGENTS.md exists", async () => {
    // test
  });

  it("doesn't duplicate if already present", async () => {
    // test
  });

  it("skips with --skip-agent-docs", async () => {
    // test
  });

  it("always creates component AGENTS.md", async () => {
    // test
  });
});
```

## File Summary

**New (2)**:

- `cli/src/commands/shared/agent-docs.ts`
- `cli/tests/commands/agent-docs.test.ts`

**Modified (6)**:

- `cli/src/commands/init.ts`
- `cli/src/commands/add/component.ts`
- `cli/src/commands/add/types.ts`
- `cli/src/commands/upgrade/index.ts`
- `cli/src/cli.ts`
- `cli/AGENTS.md` (document the feature)

## User Flow

```bash
$ npx tambo init
Step 1: Authentication ✓
Step 2: Creating tambo.ts ✓
? Update/add AGENTS.md and CLAUDE.md for LLMs? (Y/n) Y
✓ Agent docs: Created AGENTS.md, Created component AGENTS.md

$ npx tambo add message
✓ Installed message
✓ Agent docs: AGENTS.md already up-to-date, Updated component AGENTS.md

$ npx tambo upgrade
...
3. Upgrading agent documentation
? Update/add AGENTS.md and CLAUDE.md for LLMs? (Y/n) Y
✓ Agent docs: AGENTS.md already up-to-date, Updated component AGENTS.md
```

## Checklist

- [ ] Create `agent-docs.ts` with logic
- [ ] Add to `init.ts` (2 places)
- [ ] Add to `add/component.ts`
- [ ] Add to `upgrade/index.ts`
- [ ] Add `--skip-agent-docs` flag
- [ ] Update type interfaces
- [ ] Write tests
- [ ] Update `cli/AGENTS.md`
- [ ] Test all flows
- [ ] Verify no duplicates
