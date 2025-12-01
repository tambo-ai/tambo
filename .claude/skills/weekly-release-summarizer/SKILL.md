---
name: weekly-release-summarizer
description: Generates weekly or monthly developer summaries for Tambo releases across repositories
---

# Weekly/Monthly Release Summarizer

This skill generates **external user-focused** release summaries for the Tambo ecosystem. It analyzes git history, release notes, and changelogs to produce scannable summaries that emphasize user benefits.

## What This Skill Does

1. **Gathers Release Data** - Collects commits, merged PRs, and release tags from the specified time period
2. **Identifies User-Facing Changes** - Filters for changes that matter to external users
3. **Frames Benefits** - Translates technical changes into user benefits
4. **Generates Scannable Summary** - Produces a clean, easy-to-read format

## When to Use This Skill

Use this skill when:

- Preparing weekly or monthly developer update emails
- Creating release notes for external users
- Summarizing what shipped in a sprint
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

### Step 4: Identify Package Changes

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

### Step 5: Filter for User-Facing Changes

Focus on changes that matter to external users:

1. **New features** (`feat:` commits) - What can users do now?
2. **Bug fixes** that affected user experience
3. **Performance improvements** users would notice
4. **New integrations** (MCP servers, AI providers, etc.)
5. **DX improvements** (better errors, CLI improvements, agent support)

**Skip internal changes** like:

- Pure refactors with no user impact
- Internal tooling changes
- Most dependency bumps (unless significant)
- Test additions
- CI/CD changes

### Step 6: Ask User for Context

Before writing the summary, present the detected features to the user and ask for context. This ensures you frame each change correctly.

```
I found these user-facing changes from [date range]:

1. **[Feature/Fix Name]** - [Brief technical description from commit]
2. **[Feature/Fix Name]** - [Brief technical description from commit]
3. **[Feature/Fix Name]** - [Brief technical description from commit]

For each of these, can you help me understand:
- Why does this matter to users?
- What's the main benefit or use case?
- Any specific framing I should use?

Feel free to skip any that are self-explanatory or add context only where needed.
```

Use the user's input to write benefit-focused descriptions. If the user doesn't provide context for an item, use your best judgment based on the commit messages and code changes.

### Step 7: Generate Summary

Produce a **scannable, benefit-focused** summary using this template:

```markdown
# Tambo Weekly Update

**[Date Range]**

---

**[Feature Name]** — [1-2 sentence description of what it does and why users care. Focus on the benefit, not the implementation.]

**[Feature Name]** — [Description focusing on user benefit.]

**[Bug Fix]** — [What was broken and how it's fixed now.]

---

**Releases:** @tambo-ai/react vX.X.X · tambo CLI vX.X.X · API vX.X.X
```

### Key Formatting Rules

1. **Bold feature names** as the lead-in
2. **Em dash (—)** separates the name from description
3. **One paragraph per item** - no bullet lists for main content
4. **Benefit-first language** - explain what users can do, not what we did
5. **Releases on one line** at the bottom, separated by middle dots (·)
6. **Horizontal rules** to separate header and footer from content

### Step 8: Review and Refine

Present the draft summary to the user. Be ready to adjust length or emphasis based on feedback.

## Writing Guidelines

### Focus on User Benefits

BAD: "Refactored MCP authentication endpoints"
GOOD: "Connecting to authenticated MCP services like GitHub, Linear, or Notion is now more reliable out of the box."

BAD: "CLI now detects non-interactive environments"
GOOD: "AI coding agents like Claude Code, Cursor, and Copilot can now run `tambo init` and `tambo add` reliably."

BAD: "Fixed hot-reloading issues"
GOOD: "Your changes now reflect immediately during local development."

### Be Scannable

- Each item should be readable in 5 seconds
- Lead with the most important word (the feature name)
- Keep descriptions to 1-2 sentences max
- No nested bullets or complex structure

### Skip the Noise

- Don't list dependency updates unless they unlock new features
- Don't mention internal refactors
- Don't include PR numbers in the main summary
- Don't add "Contributors" sections for weekly updates

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
