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

Compute the reporting window (previous Monday–Sunday, America/Los_Angeles), then derive corresponding UTC timestamps for accurate comparison with GitHub's `publishedAt`:

These commands assume GNU `date` (Linux/Devbox). On macOS, you'll typically need `gdate` from `coreutils`.

```bash
if command -v gdate >/dev/null 2>&1; then
  DATE_BIN=gdate
else
  DATE_BIN=date
fi

# Verify GNU-compatible `date` support for -d and @epoch.
if ! "$DATE_BIN" -d @0 +%s >/dev/null 2>&1; then
  cat >&2 <<'EOF'
This script requires GNU date (supports `-d` and @epoch).

On macOS, the default `date` is BSD and will not work; install GNU coreutils and use `gdate`:
  brew install coreutils   # then ensure `gdate` is on PATH

On Debian:  apt-get install coreutils
On Alpine:  apk add coreutils
EOF
  exit 1
fi

export TZ=America/Los_Angeles
end_date=$($DATE_BIN -d 'yesterday' +%F)
start_date=$($DATE_BIN -d "$end_date -6 days" +%F)
next_date=$($DATE_BIN -d "$end_date +1 day" +%F)

# Define the LA-local window, then convert to UTC ISO timestamps for comparison
# with GitHub's `publishedAt` values. `start_ts` is inclusive; `next_ts` is the
# exclusive upper bound.
start_epoch=$($DATE_BIN -d "$start_date 00:00" +%s)
next_epoch=$($DATE_BIN -d "$next_date 00:00" +%s)
start_ts="$($DATE_BIN -u -d "@$start_epoch" +%FT%T)Z"
next_ts="$($DATE_BIN -u -d "@$next_epoch" +%FT%T)Z"

echo "window: $start_date..$end_date"
echo "start_ts (UTC): $start_ts"
echo "next_ts (UTC): $next_ts"
```

Using the `start_ts` and `next_ts` variables computed above, filter releases whose `publishedAt` (UTC) falls between the UTC timestamps corresponding to the LA-local start and end days.

Note: don’t compare only the `YYYY-MM-DD` portion of `publishedAt`; always compare the full UTC timestamps to correctly handle time zones and DST.

```bash
: "${start_ts:?start_ts must be set (see snippet above)}"
: "${next_ts:?next_ts must be set (see snippet above)}"

RELEASE_LIMIT="${RELEASE_LIMIT:-500}"
releases_file=$(mktemp 2>/dev/null) || {
  echo "Error: failed to create temporary file for releases." >&2
  exit 1
}
trap 'rm -f "$releases_file"' EXIT

# Note: this assumes you've already computed `start_ts`/`next_ts` in the snippet
# above.
if ! gh release list --limit "$RELEASE_LIMIT" --json tagName,name,publishedAt,url > "$releases_file"; then
  echo "Error: failed to fetch releases via gh CLI." >&2
  exit 1
fi

count=$(jq 'length' "$releases_file")
if [ "$count" -eq 0 ]; then
  echo "No releases returned by gh for this window; nothing to process." >&2
fi
if [ "$count" -ge "$RELEASE_LIMIT" ]; then
  echo "Warning: fetched $count releases (limit=$RELEASE_LIMIT); there may be additional releases in the window. Consider increasing RELEASE_LIMIT." >&2
  echo "Hint: re-run with a higher limit, e.g. 'RELEASE_LIMIT=2000 ...'" >&2
  earliest=$(jq -r 'map(.publishedAt) | min // empty' "$releases_file")
  earliest_epoch=$($DATE_BIN -d "$earliest" +%s 2>/dev/null || echo "")
  start_epoch_check=$($DATE_BIN -d "$start_ts" +%s 2>/dev/null || echo "")
  if [ -n "$earliest_epoch" ] && [ -n "$start_epoch_check" ] && [ "$earliest_epoch" -gt "$start_epoch_check" ]; then
    echo "Warning: earliest fetched release ($earliest) is after start_ts ($start_ts); older releases in the window may be missing. Consider increasing RELEASE_LIMIT." >&2
    echo "Hint: increase RELEASE_LIMIT and re-run the fetch step." >&2
  fi
fi

# Note: `$start_ts` and `$next_ts` are UTC timestamps derived from LA-local day
# bounds, and can be compared to GitHub's `publishedAt` (UTC).
jq -r --arg start_ts "$start_ts" --arg next_ts "$next_ts" '
  map(select(.publishedAt >= $start_ts and .publishedAt < $next_ts))
  | sort_by(.publishedAt)
  | .[]
  | {tagName,name,publishedAt,url}
  | @json
' "$releases_file"
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
