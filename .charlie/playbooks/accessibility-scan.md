# Accessibility scan (weekly)

## Overview

Scan `apps/web` component files for two categories of accessibility issues, then open a PR that fixes them:

1. **Non-semantic interactive elements**: `role="button"` on `<div>` or `<span>` elements that should be `<button>` elements instead.
2. **Missing or generic aria-labels**: Icon-only buttons without `aria-label`, or interactive elements with generic labels (e.g., "Delete", "Close") that lack context about what they target.

## Creates

- Artifact: Pull request with fixes
- Branch pattern: `charlie/a11y-scan-<end_date>`
- Title pattern: "fix(web): accessibility scan <end_date>"

## Limits

- Max fixes per run: 5 per scan category (10 total max)
- Scope: `apps/web` only (`.tsx` files)
- Guardrails:
  - Scan 1: Flag `<div` or `<span` elements with `role="button"` that should be replaced with `<button>` or `<Button>`.
  - Scan 2: Flag icon-only buttons missing `aria-label` and interactive elements with generic one-word labels that lack context.
  - Exclude test files (`*.test.tsx`, `*.test.ts`, `__fixtures__/`, `__mocks__/`), build output (`.next/`, `node_modules/`), and generated files.
  - Each finding must include the file path, line number, and matched pattern.
  - Prioritize recently modified files (most likely to be actively worked on).
  - Fixes must not change component behavior -- only improve accessibility markup.

## Data collection

Compute the reporting window (previous Monday-Sunday, America/Los_Angeles):

These commands assume GNU `date` (Linux/Devbox). On macOS, use `gdate` from `coreutils`.

```bash
export TZ=America/Los_Angeles
end_date=$(date -d 'yesterday' +%F)
start_date=$(date -d "$end_date -6 days" +%F)
echo "window: $start_date..$end_date"
```

Standard exclusion globs (reuse across scans):

```bash
EXCLUDES=(
  --glob '!**/*.test.tsx'
  --glob '!**/*.test.ts'
  --glob '!**/__fixtures__/**'
  --glob '!**/__mocks__/**'
  --glob '!**/.next/**'
  --glob '!**/node_modules/**'
)
```

### Scan 1: Non-semantic interactive elements

Find `role="button"` on div/span elements:

```bash
rg -n 'role="button"' "${EXCLUDES[@]}" apps/web --glob '*.tsx'
```

For each match, check whether the element is a `<div` or `<span` (not already a `<button>`). Only flag div/span elements.

### Scan 2: Missing or generic aria-labels

Find icon-only buttons (buttons containing only an icon component with no visible text) that lack `aria-label`:

```bash
rg -n '<Button[^>]*size="icon"' "${EXCLUDES[@]}" apps/web --glob '*.tsx'
```

For each match, check whether `aria-label` is present on the element. Flag if missing.

Find generic one-word aria-labels that lack context:

```bash
rg -n 'aria-label="(Delete|Close|Edit|Remove|Copy|Add|Save|Cancel|Open|Toggle)"' "${EXCLUDES[@]}" apps/web --glob '*.tsx'
```

These labels are considered generic because they don't describe what is being deleted, closed, etc. The fix is to add context, e.g., `aria-label="Delete"` becomes `aria-label={`Delete skill ${name}`}`.

### Recency sorting

For each file with matches, get the last commit date to determine recency:

```bash
git log -n 1 --format='%ci' -- <file-path>
```

Sort files by last commit date (most recent first) and take the first 5 findings per scan category.

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- Fewer than 2 total findings across both scans after filtering exclusions.

## Steps

1. Compute `start_date` and `end_date` for the previous Monday-Sunday window (America/Los_Angeles).
2. Run Scan 1 (`role="button"` on non-button elements) against `apps/web` `.tsx` files.
3. Run Scan 2 (missing/generic aria-labels) against `apps/web` `.tsx` files.
4. For each match in both scans, verify it is a true positive:
   - Skip commented-out code (lines starting with `//` or inside `/* */` blocks).
   - For Scan 1: confirm the element is a `<div` or `<span`, not already a `<button>`.
   - For Scan 2: confirm the button is truly icon-only (no visible text children) or the label is truly generic (no interpolated context).
5. For each file with matches, retrieve the last commit date via `git log`.
6. Sort by recency (most recently modified files first) and cap at 5 candidates per category.
7. Fix findings directly in the source files:
   - **Non-semantic elements**: Replace `<div role="button" tabIndex={0} onClick={handler} onKeyDown={...}>` with `<button onClick={handler} className={...}>`. Preserve existing `className` and `aria-label`. Remove the manual `onKeyDown` Enter/Space handler (native `<button>` handles this). Remove `tabIndex={0}` (native `<button>` is focusable by default). If the div had `cursor-pointer` in its className, that can also be removed (buttons have pointer cursor by default with proper styling).
   - **Missing aria-labels**: Add a descriptive `aria-label` that includes both the action and target, e.g., `aria-label={`Delete skill ${name}`}`. Look at the component's props or surrounding context to find the appropriate target name.
   - **Generic aria-labels**: Replace the static string with a template literal that includes context from the component's props or state.
8. Run `npm run lint`, `npm run check-types`, and `npm test` to verify fixes.
9. Create a PR with:
   - Branch: `charlie/a11y-scan-<end_date>`
   - Title: `fix(web): accessibility scan <end_date>`
   - Body: summary of findings and fixes per category, with file paths and before/after markup.

## Verify

- Every fix corresponds to a real finding (file path + line number verifiable with `rg`).
- No findings are from test files, build output, or excluded paths.
- No findings are from commented-out code.
- Replaced `<button>` elements preserve the original click behavior.
- Added `aria-label` values include context (not just the action verb).
- The total fixes do not exceed 5 per category.
- All fixed files exist in `apps/web`.
- `npm run lint`, `npm run check-types`, and `npm test` pass after fixes.
- PR is created and ready for review.

## References

- `AGENTS.md` section 4 (Accessibility): semantic HTML, proper labels, roles
- `devdocs/skills/accessibility-checklist/SKILL.md`: project accessibility standards
- WAI-ARIA button role: <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role>
- Baseline analysis: 2026-04-02 audit of `apps/web` accessibility patterns (11 role="button" instances across 5 files)
