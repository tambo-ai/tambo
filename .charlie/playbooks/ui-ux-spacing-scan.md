# UI/UX spacing scan (weekly)

## Overview

Create a Linear issue covering two categories of spacing issues in `apps/web` component files:

1. **Banned classes**: `space-x-*` and `space-y-*` usage, explicitly discouraged by `AGENTS.md` in favor of `gap-*` with flex/grid layouts.
2. **Off-scale values**: Margin, padding, and gap classes using values outside the project's allowed spacing scale.

## Creates

- Artifact: Linear issue
- Team: `TAM`
- Title pattern: "UI/UX spacing scan: \<YYYY-MM-DD>"

## Limits

- Max artifacts per run: 1 issue
- Max candidates listed: 10 per scan category (20 total max)
- Scope: `apps/web` only (`.tsx` files)
- Guardrails:
  - Scan 1: Flag `space-x-*` and `space-y-*` Tailwind utility classes.
  - Scan 2: Flag spacing utilities with values outside the allowed scale or using arbitrary bracket syntax.
  - Exclude test files (`*.test.tsx`, `*.test.ts`, `__fixtures__/`, `__mocks__/`), build output (`.next/`, `node_modules/`), and generated files.
  - Exclude SVG elements and SVG component files from off-scale detection.
  - Each finding must include the file path, line number, and matched class.
  - Prioritize recently modified files (most likely to be actively worked on).

## Allowed spacing scale

Baseline established 2026-04-01 via frequency analysis of `apps/web`. These are the Tailwind spacing values considered standard for this project:

```
0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8, 12, 16, 20, 24, 32
```

Any spacing utility (`m-*`, `p-*`, `gap-*`) using a numeric value **not** in this set is flagged as off-scale. Examples of off-scale values: `5`, `7`, `9`, `10`, `14`, and non-half decimals like `5.2`.

**Arbitrary values** (bracket syntax like `p-[48px]`) are flagged separately as "review needed" since they bypass the design system entirely.

**SVG/icon exclusion**: Values that appear inside `.svg` files or SVG markup (common source of odd decimals like `m-9.945`) should be excluded from findings.

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

### Scan 1: Banned classes (`space-x-*` / `space-y-*`)

Find all `space-x-*` and `space-y-*` usages in `.tsx` files:

```bash
rg -n 'space-[xy]-' "${EXCLUDES[@]}" apps/web --glob '*.tsx'
```

### Scan 2: Off-scale spacing values

Find all margin, padding, and gap classes, then filter to those with values outside the allowed scale:

```bash
rg -on '(?:m[trblxy]?|p[trblxy]?|gap(?:-[xy])?)-(\[[^\]]+\]|\d+\.?\d*)' \
  "${EXCLUDES[@]}" apps/web --glob '*.tsx'
```

For each match, extract the numeric value and check against the allowed scale. Flag if:

- The value is numeric and not in `0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8, 12, 16, 20, 24, 32`
- The value uses bracket syntax (arbitrary value)

Skip lines that are inside SVG elements (`<svg`, `<path`, `<rect`, etc.) or SVG component files.

### Recency sorting

For each file with matches, get the last commit date to determine recency:

```bash
git log -n 1 --format='%ci' -- <file-path>
```

Sort files by last commit date (most recent first) and take the first 10 findings per scan category.

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- Fewer than 2 total findings across both scans after filtering exclusions.

## Steps

1. Compute `start_date` and `end_date` for the previous Monday-Sunday window (America/Los_Angeles).
2. Run Scan 1 (`space-[xy]-`) against `apps/web` `.tsx` files.
3. Run Scan 2 (off-scale spacing values) against `apps/web` `.tsx` files.
4. For each match in both scans, verify it is a true positive:
   - Skip commented-out code (lines starting with `//` or inside `/* */` blocks).
   - Skip matches inside string literals that are not className values (rare but possible).
   - For Scan 2: skip lines inside SVG elements or SVG component files.
5. For each file with matches, retrieve the last commit date via `git log`.
6. Sort by recency (most recently modified files first) and cap at 10 candidates per category.
7. Create a Linear issue in team `TAM` titled "UI/UX spacing scan: <start_date>-<end_date>" with a Markdown body containing:
   - A short summary (total issues found repo-wide vs. the ones listed)
   - **Banned classes section**:
     - A reference to the `AGENTS.md` guideline: "Avoid `space-x-*`/`space-y-*`; use `gap-*` with flex/grid instead."
     - Findings with file path, line number, matched line, and the specific `space-*` class to replace
     - A note that the parent element likely needs `flex` + `gap-*` as the replacement pattern
   - **Off-scale values section**:
     - The allowed spacing scale for reference
     - Findings with file path, line number, matched line, the off-scale value, and the nearest allowed value(s)
     - Arbitrary bracket values listed separately as "review needed"

## Verify

- Every finding includes a file path and line number verifiable with `rg`.
- No findings are from test files, build output, or excluded paths.
- No findings are from commented-out code.
- No off-scale findings are from SVG elements or SVG component files.
- The total count does not exceed 10 candidates per category.
- All listed files exist in `apps/web`.
- Off-scale findings correctly identify values not in the allowed scale.

## References

- `AGENTS.md` section 4 (Layout & Styling): "Avoid `space-x-*`/`space-y-*`"
- Tailwind CSS gap utilities: <https://tailwindcss.com/docs/gap>
- Tailwind CSS default spacing scale: <https://tailwindcss.com/docs/customizing-spacing>
- Baseline analysis: 2026-04-01 frequency scan of `apps/web` spacing classes
