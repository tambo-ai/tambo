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
  - Exclude public API surfaces (only workspaces with `package.json.private === true` are eligible).
  - Do not propose removing generated code, migrations, build output, or vendored code.

## Data collection

Compute the reporting window (previous Monday–Sunday, America/Los_Angeles):

These commands assume GNU `date` (Linux/Devbox). On macOS, use `gdate` from `coreutils`.

Rule: only workspaces with `package.json.private === true` are eligible; `private=false` and `private` missing are treated as public (set `private: true` explicitly if the workspace is internal-only).

```bash
export TZ=America/Los_Angeles
end_date=$(date -d 'yesterday' +%F)
start_date=$(date -d "$end_date -6 days" +%F)
echo "window: $start_date..$end_date"
```

Identify “public” workspaces (skip these entirely):

This snippet assumes you're running from the repo root, using `bash`, and have `jq` installed.

```bash
#!/usr/bin/env bash

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required for workspace detection; please install jq and re-run." >&2
  exit 1
fi
[ -f package.json ] || { echo "Run this from the repo root (package.json not found)" >&2; exit 1; }

workspaces=$(jq -r '
  if (.workspaces | type == "array") then
    .workspaces[]?
  elif (.workspaces | type == "object") then
    .workspaces.packages[]?
  else
    empty
  end
  ' package.json)

if [ -z "$workspaces" ]; then
  echo "No workspaces found in package.json; falling back to a basic scan of common monorepo directories." >&2
  workspaces=$(printf '%s\n' 'apps/*' 'packages/*' 'cli' 'create-tambo-app' 'docs' 'react-sdk' 'showcase')
fi

build_workspace_report() {
  local patterns="$1"
  while IFS= read -r pattern; do
    [ -n "$pattern" ] || continue
    for p in $pattern; do
      [ -d "$p" ] || continue
      if [ -f "$p/package.json" ]; then
        is_private=$(jq -r '.private == true' "$p/package.json")
        priv=$(jq -r 'if has("private") then (.private | tostring) else "missing" end' "$p/package.json")
        name=$(jq -r 'if has("name") and (.name != null and .name != "") then .name else "<no-name>" end' "$p/package.json")
        printf '%s\t%s\teligible=%s\tprivate=%s\n' "$p" "$name" "$is_private" "$priv"
      fi
    done
  done <<< "$patterns"
}

printf 'Scanning workspace patterns:\n%s\n' "$workspaces" >&2
workspace_report=$(build_workspace_report "$workspaces" | sort)
if [ -z "$workspace_report" ]; then
  echo "Warning: no workspaces matched patterns (check package.json workspaces)." >&2
fi

printf '%s\n' "$workspace_report"

printf '\nEligible workspaces (private is boolean true):\n'
eligible_workspaces=$(printf '%s\n' "$workspace_report" | awk -F '\t' '$3 == "eligible=true" { print $1 }')
if [ -z "$eligible_workspaces" ]; then
  echo "(none)" >&2
else
  printf '%s\n' "$eligible_workspaces"
fi
```

When searching for dead code, only analyze paths listed under `Eligible workspaces (private is boolean true)` above.

> Note: if you expect a workspace to be scanned but it does not show up under `Eligible workspaces (private is boolean true)`, check its `package.json` and set `"private": true` for internal-only packages.

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

- No candidates are from public workspaces (per the `private=true` rule above).
- Each candidate has at least two independent signals recorded.
- The list avoids generated/build/migrations paths.

## References

- `package.json` workspaces and per-workspace `package.json` `private` flags
- `.gitignore` and build output directories (`dist/`, `.next/`)
