# Documentation updater (on merge to main, apps/web only)

## Overview

After a PR merging into `main` touches files under `apps/web/`, review the changed files and update any documentation that the changes would make incorrect: `apps/web/AGENTS.md`, `apps/web/README.md`, `apps/web/app/blog/AGENTS.md`, and the root `AGENTS.md` (apps/web section only).

## Creates

- Artifact: GitHub pull request
- Title pattern: "docs(web): update documentation for <merged-pr-title>"

## Limits

- Max artifacts per run: 1 pull request
- Guardrails:
  - Only update documentation that is now **factually wrong** due to the merged changes. Do not add new sections, improve prose, or expand coverage speculatively.
  - Do not touch documentation outside `apps/web/AGENTS.md`, `apps/web/README.md`, `apps/web/app/blog/AGENTS.md`, or the `apps/web` section of the root `AGENTS.md` unless the merge clearly broke a cross-reference.
  - Do not modify code files, configs, or tests.
  - If no documentation is stale, no-op (do not open an empty PR).

## Data collection

Identify the most recent commit on `main` (this repo uses squash merges, so every commit has a single parent and `--merges` would match nothing):

```bash
git fetch origin main
latest_commit=$(git log -1 --format='%H %s' origin/main)
commit_sha=$(echo "$latest_commit" | awk '{print $1}')
commit_title=$(echo "$latest_commit" | cut -d' ' -f2-)
echo "commit: $commit_sha"
echo "title: $commit_title"
```

Check whether `apps/web/` was touched:

```bash
web_files=$(git diff-tree --no-commit-id -r --name-only "$commit_sha" -- apps/web/)
if [ -z "$web_files" ]; then
  echo "No apps/web/ changes in this commit; no-op."
  exit 0
fi
echo "Changed files in apps/web/:"
echo "$web_files"
```

Gather the full diff for `apps/web/` to understand what changed:

```bash
git diff-tree -p --no-commit-id "$commit_sha" -- apps/web/
```

Read the current documentation files that might need updates:

```bash
cat apps/web/AGENTS.md
cat apps/web/README.md
cat apps/web/app/blog/AGENTS.md
cat AGENTS.md
```

## No-op when

- The latest commit on `main` did not touch any files under `apps/web/`.

- A docs PR for this commit already exists (search for the commit SHA in open PR branches to deduplicate).

- All existing documentation already accurately reflects the changes (nothing is factually wrong).

- The commit only touched files that have no documentation surface (e.g., test fixtures, snapshots, generated assets).

## Steps

1. Identify the latest commit on `main` and confirm it touched `apps/web/` files. If not, stop.
2. Check whether a docs PR for this commit already exists. If so, stop.
3. Read the full diff for `apps/web/` in that commit.
4. Read the current `apps/web/AGENTS.md`, `apps/web/README.md`, and `apps/web/app/blog/AGENTS.md`.
5. Compare the diff against the documentation. Identify statements that are now factually incorrect due to the merged changes. Common categories:
   - **Directory structure**: files or directories added, moved, or removed.
   - **Commands**: scripts renamed, flags changed, new commands added.
   - **Patterns**: new providers, hooks, or data-fetching patterns introduced that contradict documented guidance.
   - **Dependencies**: new UI primitives or libraries referenced that the docs claim don't exist.
6. If nothing is stale, stop (no-op).
7. Draft minimal documentation edits that correct the inaccuracies. Do not rewrite surrounding prose.
8. Create a branch from `main`, commit only the doc changes, and open a PR.

## Verify

- Every edit corrects a factual inaccuracy introduced by the triggering commit (not a pre-existing gap).
- No code, config, or test files were modified.
- The PR diff is small and reviewable (documentation-only).
- `apps/web/AGENTS.md`, `apps/web/README.md`, and `apps/web/app/blog/AGENTS.md` remain internally consistent after edits.

## References

- `apps/web/AGENTS.md` (primary documentation for the web app)
- `apps/web/README.md`
- `apps/web/app/blog/AGENTS.md`
- `AGENTS.md` (root, `apps/web` section)
