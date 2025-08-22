Release Notes — Agent SOP (Steps & Output Only)

Note

- This SOP is for the docs site. The canonical deliverable is an MDX page published in the docs site.
- Use GitHub MCP to access repositories and analyze commits for enhanced context and accuracy.

This should all run in the tambo repo with the doc site.

Scope

- Repos: tambo (React SDK), tambo-cloud (Server Updates), tambo-template (Component Library Updates), typescript-sdk (included under React SDK section).
- Branch: main for all repos.
- Since bound: use previous note's date/SHAs or a provided YYYY-MM-DD.
- Focus: Final feature releases only - avoid documenting incremental development commits that don't represent completed functionality.

Artifacts (must be generated and maintained during the process so it can be resumed and introspected)

- 1. commits-<YYYY-MM-DD>.md: All non-merge commits collected per repo for the window (repo, sha, shortSha, date, subject, author).
- 2. summaries-<YYYY-MM-DD>.md: 1–2 sentence summaries per commit (same keys plus summary and tags like needsDiffReview. Review diffs for high‑impact items per Diff Review rules below.
- 3. <YYYY-MM-DD>.json: Run metadata in .asops/release_notes/runs/ for future runs (last commit SHAs, counts, status).

All working artifacts go in .asops/local/ (gitignored). Only run metadata goes in .asops/release_notes/runs/ (tracked).

Steps

1. Collect commits per repo
   - Use GitHub MCP to fetch all non-merge commits to main since the lower bound up to now.
   - Exclude merge commits and incremental development commits that don't represent final features.
   - Artifact: write commits to .asops/local/commits-<YYYY-MM-DD>.md for the current note id.

2. Classify commits
   - Docs-only: commits only touching docs/**, **/README\*, website/\*\* → move to Other → Docs.
   - Version bumps: version/metadata-only updates → Other → Version bumps.
   - Artifact: update entries in .asops/local/summaries-<YYYY-MM-DD>.md with classification.

3. Summarize each commit (1–2 sentences per commit)
   - Focus on user-visible impact and API/behavior changes.
   - Avoid restating the subject line; explain what changed and why it matters.
   - Explicitly note breaking changes, migrations, or deprecations.
   - Flag commits that need diff review with needsDiffReview: true
     - Always review diffs for commits with types like: feat, fix, refactor, perf, security, revert (that changes behavior), chore(config/build) that might alter runtime, or anything touching API, auth, data models, or migrations.
     - Skippable (no diff review): pure version bumps, lockfile-only, formatting, docs-only, CI-only, or changes scoped to deps without code changes.
   - Artifact: write per-commit summaries and flags to .asops/local/summaries-<YYYY-MM-DD>.md.

4. Code review for flagged commits (CRITICAL STEP)
   - Review the actual code diff for ALL commits flagged with needsDiffReview: true.
   - Use GitHub MCP to examine actual code changes and pull request context for enhanced accuracy.
   - Update summaries with accurate details based on actual code changes:
     - Identify breaking changes, API modifications, security implications
     - Note migration requirements, deprecations, behavioral changes
     - Add priority flags: BREAKING CHANGE, CRITICAL, SECURITY, PERFORMANCE
     - Include specific file moves, interface changes, required wrapper components
   - Never review dependency-only upgrades, lockfile changes, or formatting commits.
   - Artifact: update .asops/local/summaries-<YYYY-MM-DD>.md with code-review-based descriptions.

5. Group and order the summaries (MUST HAPPEN AFTER CODE REVIEW)
   - Use the updated summaries from step 4 that include code-review-based details.
   - AGGRESSIVE GROUPING: Consolidate related commits across all repos into single feature bullets. Examples:
     - "Added context helper to pass context using hooks" → Server API (commit), TypeScript SDK (commit), React Package (commit), Docs update, Template implementation.
     - Group incremental commits for the same feature into one final release bullet.
     - Combine related bug fixes, performance improvements, or API changes under unified themes.
   - KEEP IT CONCISE: Focus on user-impacting changes only. Cut noise.
     - REMOVE: dependency updates, docs-only changes, version bumps, dev tooling, observability details
     - REMOVE: showcase fixes, SEO updates, minor UI tweaks, build configuration
     - KEEP: breaking changes, new features, critical fixes, security improvements, major performance gains
   - Final organization: by type of change, not by repository.
     1. Breaking Changes — API changes requiring migration (max 3-4 items, consolidate related changes)
     2. New Features — new end-user functionality (max 2-3 items)
     3. Critical Fixes — high-impact bug fixes and performance improvements (max 2-3 items)
     4. Security Fixes — security vulnerabilities and enhancements (if any)
   - NO "Other" section - if it's not important enough for the main sections, don't include it
   - Use the commit URL; label with short SHA.
   - Include priority flags (BREAKING CHANGE, CRITICAL, SECURITY) in descriptions.
   - Add context about what features enable for users, not just technical implementation.
   - Target 40-60 lines total for the entire release notes file.
   - Artifact: produce RELEASE_NOTES_YYYY-MM-DD.mdx under docs/content/docs/release-notes/.

Output

- Docs MDX: Release Notes section in the docs site, file named RELEASE_NOTES_YYYY-MM-DD.mdx.
- Each bullet links to the commit.

Destination (docs site)

- Primary: Docs site (MDX). Place at: docs/content/docs/release-notes/RELEASE_NOTES_YYYY-MM-DD.mdx

Resuming & State Management

- Check for previous run: look in .asops/release_notes/runs/ for most recent JSON file
- Use previous run's last_commit_sha per repo as lower bound for commit collection
- Working state file (untracked): .asops/local/state-<YYYY-MM-DD>.md for current session progress
- Run completion: create .asops/release_notes/runs/<YYYY-MM-DD>.json with:
  - run_date, run_timestamp, period (since/until)
  - repos: {repo_name: {last_commit_sha, last_commit_short, last_commit_date, commits_processed}}
  - total_commits, output_file, breaking_changes, new_features, critical_fixes, security_fixes, status
- Working draft (optional, untracked): .asops/local/drafts/RELEASE_NOTES_YYYY-MM-DD.mdx

Acceptance

- All relevant commits included and correctly classified, focusing on final feature releases.
- Every commit flagged with needsDiffReview has been code-reviewed using GitHub MCP for enhanced context.
- Summaries include accurate details from actual code changes (not just commit messages).
- Breaking changes, security fixes, and critical issues are properly flagged and include migration guidance.
- Final MDX uses AGGRESSIVE GROUPING with cross-repo bullets for unified feature releases.
- Release notes are CONCISE (40-60 lines total) - no "Other" section, no dependency noise.
- Only user-impacting changes included: breaking changes, new features, critical fixes, security.
- Links valid; short SHAs used in labels.
- Priority flags (BREAKING CHANGE, CRITICAL, SECURITY) are included where appropriate.
- GitHub MCP utilized throughout for repository access and enhanced commit analysis.
