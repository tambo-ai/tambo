# Team update (weekly)

## Overview

Create a Linear issue that summarizes what shipped last week for the internal team: merged PRs, contributors, and completed issues.

## Creates

- Artifact: Linear issue
- Team: `TAM`
- Title pattern: "Team update: <YYYY-MM-DD>–<YYYY-MM-DD>"

## Limits

- Max artifacts per run: 1 issue
- Guardrails:
  - Keep the update scannable: group by area/package, then highlight a few key outcomes.
  - Avoid listing every tiny change; link to PRs for details.

## Data collection

Compute the reporting window (previous Monday–Sunday, America/Los_Angeles):

These commands assume GNU `date` (Linux/Devbox). On macOS, use `gdate` from `coreutils`.

```bash
export TZ=America/Los_Angeles
end_date=$(date -d 'yesterday' +%F)
start_date=$(date -d "$end_date -6 days" +%F)
next_date=$(date -d "$end_date +1 day" +%F)
echo "window: $start_date..$end_date"
```

Fetch merged PRs on `main` in the window:

```bash
gh pr list \
  --state merged \
  --search "is:pr is:merged base:main merged:$start_date..$end_date" \
  --limit 200 \
  --json number,title,url,author,mergedAt,files \
  > /tmp/merged-prs.json
```

Group PRs by top-level area (examples): `apps/api`, `apps/web`, `react-sdk`, `cli`, `packages/<name>`, `docs`, `showcase`.

Fetch completed Linear issues (use `completedAt` from JSON to avoid “updated” noise):

```bash
ch-linear issue list \
  -T TAM \
  --state Done \
  --updated ">=$start_date" \
  --updated "<$next_date" \
  --limit 250 \
  --json \
  > /tmp/done-issues.json

jq -r --arg start "$start_date" --arg next "$next_date" '
  map(select(.completedAt != null and .completedAt >= $start and .completedAt < $next))
  | .[]
  | {identifier,title,completedAt}
  | @json
' /tmp/done-issues.json
```

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- There were no merged PRs and no completed issues in the reporting window.

## Steps

1. Compute `start_date` and `end_date` for the previous Monday–Sunday window (America/Los_Angeles).
2. Collect merged PRs into a grouped list by area/package, with links.
3. List contributors (unique PR authors) and call out notable cross-cutting themes.
4. Collect Linear issues completed in the window and list them (identifier + title).
5. Create a Linear issue in team `TAM` titled "Team update: <start_date>–<end_date>" with a Markdown body containing:
   - Highlights (3–6 bullets)
   - Merged PRs by area/package (grouped, linked)
   - Contributors (unique authors)
   - Completed issues (linked identifiers)

## Verify

- The issue’s window is explicit and correct (America/Los_Angeles, Monday–Sunday).
- PR links resolve and were merged to `main`.
- Linear issues were actually completed in the window (based on `completedAt`).

## References

- `turbo.json` (top-level package areas)
- `AGENTS.md` (repo workflow conventions)
