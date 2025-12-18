# Dead code cleanup candidates (weekly)

## Overview

Create a Linear issue listing candidates for dead code cleanup (unused files, exports, and dependencies) with at least two independent signals per candidate.

## Creates

- Artifact: Linear issue
- Team: `TAM`
- Title pattern: "Dead code cleanup candidates: <YYYY-MM-DD>–<YYYY-MM-DD>"

## Limits

- Max artifacts per run: 1 issue
- Max candidates listed: 25
- Guardrails:
  - Require at least two independent signals before listing a candidate.
  - Exclude public API surfaces. In this repo, treat any workspace with `private=false` (or missing `private`) as public.
  - Do not propose removing generated code, migrations, build output, or vendored code.

## Data collection

Compute the reporting window (previous Monday–Sunday, America/Los_Angeles):

```bash
export TZ=America/Los_Angeles
end_date=$(date -d 'yesterday' +%F)
start_date=$(date -d "$end_date -6 days" +%F)
echo "window: $start_date..$end_date"
```

Identify “public” workspaces (skip these entirely):

```bash
for p in apps/* cli create-tambo-app docs packages/* react-sdk showcase; do
  if [ -f "$p/package.json" ]; then
    priv=$(cat "$p/package.json" | jq -r '.private // false')
    name=$(cat "$p/package.json" | jq -r '.name')
    echo "$p\t$name\tprivate=$priv"
  fi
done | sort
```

Only collect candidates from private workspaces (for example: `apps/api`, `apps/web`, `packages/core`, `packages/db`, `packages/testing`, `showcase`).

Signals you can use (require at least two per candidate):

1. **No inbound references**: no other file imports/references the module.
   - For a file candidate, search by path and stem:

     ```bash
     rg -n -S -F "<relative/path/without-ext>" --glob '!**/dist/**' --glob '!**/.next/**' --glob '!**/coverage/**'
     rg -n -S -F "<file-stem>" --glob '!**/dist/**' --glob '!**/.next/**' --glob '!**/coverage/**'
     ```

2. **Not exported / not registered**: not re-exported from a barrel (`index.ts`) or wired into a runtime registry.
   - Examples to check:
     - `export * from "./<module>"` / `export { X } from "./<module>"`
     - Next.js route trees (`apps/web/app/**`) and NestJS modules (`*.module.ts`)

3. **Dormant history**: the file hasn’t changed in a long time while adjacent code did.

   ```bash
   git log -n 1 --format='%ci %h' -- <path>
   ```

4. **Unused dependency**: the dependency is listed in `dependencies` but has no imports/usages in that workspace.
   - For a given workspace:

     ```bash
     cat <workspace>/package.json | jq -r '.dependencies // {} | keys[]'
     rg -n -S "from \"<dep>\"|require\(\"<dep>\"\)" <workspace>
     ```

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- No candidates meet the two-signal requirement within private workspaces.

## Steps

1. Compute `start_date` and `end_date` for the previous Monday–Sunday window (America/Los_Angeles).
2. Enumerate candidates from private workspaces only:
   - orphaned files (no inbound references)
   - unused exports (defined and exported but never referenced in repo)
   - unused dependencies (declared but not imported)
3. For each candidate, collect at least two signals and record the evidence (commands run + summary of results).
4. Create a Linear issue in team `TAM` titled "Dead code cleanup candidates: <start_date>–<end_date>" with a Markdown body containing:
   - A short summary (counts by category)
   - A list of candidates (grouped by workspace) including:
     - Candidate path or symbol
     - Signals/evidence (at least two)
     - Suggested next action (delete file, remove export, drop dependency)

## Verify

- No candidates are from public workspaces (`private=false`).
- Each candidate has at least two independent signals recorded.
- The list avoids generated/build/migrations paths.

## References

- `package.json` workspaces and per-workspace `package.json` `private` flags
- `.gitignore` and build output directories (`dist/`, `.next/`)
