---
name: weekly-release-summarizer
description: Generates weekly or monthly developer summaries for Tambo releases across repositories
---

# Weekly/Monthly Release Summarizer

This skill generates developer-friendly release summaries for the Tambo ecosystem. It analyzes git history, release notes, and changelogs to produce concise summaries of what shipped during a specified time period.

## What This Skill Does

1. **Gathers Release Data** - Collects commits, merged PRs, and release tags from the specified time period
2. **Categorizes Changes** - Groups changes by type (features, fixes, improvements, dependencies)
3. **Identifies Highlights** - Surfaces the most impactful changes worth calling out
4. **Cross-Repository Analysis** - Handles Tambo's monorepo structure (react-sdk, cli, docs, showcase, tambo-cloud)
5. **Generates Summary** - Produces a formatted developer-friendly summary

## When to Use This Skill

Use this skill when:

- Preparing weekly or monthly developer update emails
- Creating release notes for stakeholders
- Summarizing what the team shipped in a sprint
- Generating changelog content
- Preparing content for Discord announcements or blog posts

## Repositories Covered

- **tambo/** - Main monorepo containing:
  - `react-sdk/` - Core React SDK (@tambo-ai/react)
  - `cli/` - CLI tools (tambo)
  - `docs/` - Documentation site
  - `showcase/` - Demo application
  - `create-tambo-app/` - App bootstrapper
- **tambo-cloud/** - Backend platform (if in workspace)
- **typescript-sdk/** - Generated TypeScript client (if in workspace)

## Process

### Step 1: Determine Time Range

Ask the user for the time period if not specified:

```
What time period would you like to summarize?
- "last week" (past 7 days)
- "last month" (past 30 days)
- "since [date]" (e.g., "since 2024-01-15")
- "between [date] and [date]" (e.g., "between 2024-01-01 and 2024-01-15")
```

### Step 2: Gather Git History

Run these commands to collect relevant data:

```bash
# Get commits in the time range (adjust --since accordingly)
git log --oneline --since="1 week ago" --no-merges

# Get merged PRs (via merge commits)
git log --oneline --since="1 week ago" --merges

# Get release tags in the range
git tag --sort=-creatordate | head -20

# Get detailed commit info for categorization
git log --since="1 week ago" --no-merges --format="%h %s" | head -100
```

### Step 3: Identify Releases

Look for release commits and tags:

```bash
# Find release-please commits
git log --oneline --since="1 week ago" | grep -i "release"

# Check changelog files for recent updates
git log --since="1 week ago" --oneline -- "**/CHANGELOG.md"
```

Read any updated CHANGELOG.md files to extract version numbers and summaries.

### Step 4: Categorize Changes

Group commits by conventional commit type:

| Type       | Category      | Description               |
| ---------- | ------------- | ------------------------- |
| `feat`     | Features      | New functionality         |
| `fix`      | Bug Fixes     | Bug corrections           |
| `perf`     | Performance   | Performance improvements  |
| `refactor` | Improvements  | Code quality improvements |
| `docs`     | Documentation | Documentation updates     |
| `chore`    | Maintenance   | Tooling, deps, configs    |
| `deps`     | Dependencies  | Dependency updates        |
| `test`     | Testing       | Test additions/fixes      |

### Step 5: Identify Package Changes

For each package in the monorepo, check for changes:

```bash
# react-sdk changes
git log --since="1 week ago" --oneline -- react-sdk/

# cli changes
git log --since="1 week ago" --oneline -- cli/

# docs changes
git log --since="1 week ago" --oneline -- docs/

# showcase changes
git log --since="1 week ago" --oneline -- showcase/

# tambo-cloud changes (if present)
git log --since="1 week ago" --oneline -- tambo-cloud/
```

### Step 6: Extract Highlights

Identify the most significant changes by looking for:

1. **New features** (`feat:` commits)
2. **Breaking changes** (commits mentioning "BREAKING" or major version bumps)
3. **New releases** (release-please commits with version numbers)
4. **Major bug fixes** (important `fix:` commits)
5. **New integrations** (MCP servers, AI providers, etc.)

### Step 7: Generate Summary

Produce a formatted summary using this template:

```markdown
# Tambo Release Summary: [Date Range]

## Highlights

- [Most important change 1]
- [Most important change 2]
- [Most important change 3]

## Releases

### @tambo-ai/react v0.X.X

- [Key changes from changelog]

### tambo CLI v0.X.X

- [Key changes from changelog]

## Features

- **[Feature Name]** - Brief description (PR #XXX)

## Bug Fixes

- **[Fix Description]** - What was fixed (PR #XXX)

## Improvements

- [Improvement 1]
- [Improvement 2]

## Dependencies

Updated packages:

- `package-name`: X.X.X -> Y.Y.Y

## Contributors

Thanks to everyone who contributed this period!
```

### Step 8: Review and Refine

Present the draft summary to the user:

```
Here's the generated release summary for [date range]:

[Summary content]

Would you like me to:
1. Adjust the format?
2. Add more detail to any section?
3. Change the highlight selection?
4. Generate a shorter/longer version?
```

## Output Formats

The skill can generate summaries in different formats:

### Developer Summary (Default)

Comprehensive technical summary with all categories

### Discord Announcement

Shorter, casual format suitable for Discord:

```markdown
Hey everyone! Here's what shipped this week:

**New Features**

- Feature 1
- Feature 2

**Bug Fixes**

- Fix 1

Check out the full changelog: [link]
```

### Email Newsletter

More formal format suitable for stakeholder updates

### Changelog Entry

Raw changelog format for CHANGELOG.md files

## Guidelines

- **Be concise** - Summaries should be scannable, not exhaustive
- **Highlight impact** - Focus on user-facing changes over internal refactors
- **Credit contributors** - Mention PRs and authors when relevant
- **Group related changes** - Multiple commits for one feature should be one bullet point
- **Skip trivial changes** - Omit pure chore/dependency updates unless significant
- **Use consistent formatting** - Follow the templates above
- **Include version numbers** - Always mention specific versions when discussing releases

## Error Handling

If you encounter:

- **No commits in range** - Suggest a longer time period or check if the branch is correct
- **Missing changelog** - Generate summary from commit messages instead
- **Cross-repo analysis needed** - Note which repositories need separate analysis
- **Unclear commit messages** - Look at the PR or linked issues for context

## Example Invocations

User: "Generate a weekly release summary"
User: "What did we ship last month?"
User: "Create release notes for Discord"
User: "Summarize changes since v0.40.0"
User: "What's new in the react-sdk this week?"
