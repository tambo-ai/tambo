# External release update (weekly)

## Overview

Create a Linear issue that summarizes last week’s externally relevant releases for developers using Tambo.

## Creates

- Artifact: Linear issue
- Team: `TAM`
- Title pattern: "External release update: <YYYY-MM-DD>–<YYYY-MM-DD>"

## Limits

- Max artifacts per run: 1 issue
- Guardrails:
  - Focus on external developer impact: new features, breaking changes, migration guides, and API updates.
  - Skip purely internal chores unless they change behavior externally (for example, auth changes, build output changes, dependency upgrades that affect consumers).

## Data collection

All proactive behaviors currently run daily. To make this effectively weekly, treat Monday 00:00 America/Los_Angeles as the run.

Compute the reporting window (previous Monday–Sunday, America/Los_Angeles):

These commands assume GNU `date` (Linux/Devbox). On macOS, `gdate` (from `coreutils`) is required.

```bash
if [ "$(uname)" = "Darwin" ]; then
  if ! command -v gdate >/dev/null 2>&1; then
    echo "gdate (coreutils) is required on macOS. Install via 'brew install coreutils'." >&2
    exit 1
  fi
  date() { gdate "$@"; }
fi

export TZ=America/Los_Angeles
end_date=$(date -d 'yesterday' +%F)
start_date=$(date -d "$end_date -6 days" +%F)
next_date=$(date -d "$end_date +1 day" +%F)

# Define the LA-local window, then convert to UTC ISO timestamps for comparison
# with GitHub's `publishedAt` values. `start_ts` is inclusive; `next_ts` is the
# exclusive upper bound.
start_epoch=$(date -d "$start_date 00:00" +%s)
next_epoch=$(date -d "$next_date 00:00" +%s)
start_ts="$(date -u -d "@$start_epoch" +%FT%T)Z"
next_ts="$(date -u -d "@$next_epoch" +%FT%T)Z"

echo "window: $start_date..$end_date"
echo "start_ts (UTC): $start_ts"
echo "next_ts (UTC): $next_ts"
```

Collect GitHub releases in that window:

Filter releases whose `publishedAt` (UTC) falls between the UTC timestamps corresponding to the LA-local start and end days.

Note: don’t compare only the `YYYY-MM-DD` portion of `publishedAt`; always compare the full UTC timestamps to correctly handle time zones and DST.

```bash
gh release list --limit 100 --json tagName,name,publishedAt,url > /tmp/releases.json

# Note: `$start_ts` and `$next_ts` are UTC timestamps derived from LA-local day
# bounds, and can be compared to GitHub's `publishedAt` (UTC).
jq -r --arg start_ts "$start_ts" --arg next_ts "$next_ts" '
  map(select(.publishedAt >= $start_ts and .publishedAt < $next_ts))
  | sort_by(.publishedAt)
  | .[]
  | {tagName,name,publishedAt,url}
  | @json
' /tmp/releases.json
```

For each release, fetch full notes:

```bash
gh release view <tagName> --json tagName,name,publishedAt,url,body
```

Group releases by package/component based on tag prefix (examples in this repo):

- `react-v*` → `@tambo-ai/react`
- `tambo-v*` → `tambo` CLI
- `docs-v*` → `@tambo-ai/docs`
- `showcase-v*` → `@tambo-ai/showcase`
- `api-v*` / `web-v*` → Tambo Cloud apps

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- There were no GitHub releases published in the reporting window.

## Steps

1. Compute `start_date` and `end_date` for the previous Monday–Sunday window (America/Los_Angeles).
2. List GitHub releases published in that window and group them by package/component.
3. For each package/component, extract externally relevant items from the release notes and rewrite them as a short changelog:
   - New features
   - Breaking changes (with migration notes)
   - API updates / deprecations
   - Bug fixes (only if externally visible)
4. Create a Linear issue in team `TAM` titled "External release update: <start_date>–<end_date>" with a Markdown body containing:
   - The explicit date window
   - A per-package summary (bullets)
   - Links to each GitHub release

## Verify

- The issue’s window is explicit and correct (America/Los_Angeles, Monday–Sunday).
- Every referenced GitHub release link resolves.
- The summary is external-developer-facing (avoid internal-only work).

## References

- `RELEASING.md`
- `release-please-config.json`
