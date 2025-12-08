---
description: Generate a PR description from the current branch changes
---

# Generate PR Description

Generate a comprehensive pull request description for the current branch.

## Steps:

1. **Determine base branch:**
   - Use the base branch specified by the user, or default to `main`
   - Verify the base branch exists: `git rev-parse --verify <base-branch>`

2. **Get context:**
   - Run `git log <base-branch>..HEAD --oneline` to see commits
   - Run `git diff <base-branch>...HEAD` to see all changes
   - Understand what was accomplished and why

3. **Generate description:**
   - Write a clear summary of the changes
   - Focus on the "why" not just the "what"
   - Note any breaking changes or migration steps
   - Include a brief test plan

4. **Output format:**

   ```
   ## Summary
   [1-3 bullet points of what changed]

   ## Why
   [Brief explanation of the motivation]

   ## Test Plan
   [How to verify the changes work]
   ```

5. **Ask user** if they want to create/update the PR with this description.
