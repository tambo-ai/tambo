#!/usr/bin/env sh

# Find the Tambo monorepo root by walking up from a starting directory
# until we locate a package.json whose `name` is "@tambo-ai/repo".

set -e

search_dir="${1:-$(pwd)}"
start_dir="$search_dir"

while [ "$search_dir" != "/" ]; do
  if [ -f "$search_dir/package.json" ]; then
    # Be tolerant of formatting; just require `"name"` and
    # `"@tambo-ai/repo"` on the same line.
    if grep -Eq '"name".*"@tambo-ai/repo"' "$search_dir/package.json"; then
      printf '%s\n' "$search_dir"
      exit 0
    fi
  fi

  search_dir="$(dirname "$search_dir")"
done

printf '%s\n' "Could not find repo root (no package.json with name @tambo-ai/repo found above $start_dir)" >&2
printf '%s\n' "Are you running this script from inside the Tambo repo checkout?" >&2
exit 1
