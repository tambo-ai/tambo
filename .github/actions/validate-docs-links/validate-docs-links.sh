#!/usr/bin/env bash

set -euo pipefail

broken=0

docsUrlRegex='https://docs\.tambo\.co/[^[:space:]"'\''`)}>]+'

repoRoot="${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel)}"
cd "$repoRoot"
docsRoot="$repoRoot/docs/content/docs"

docsLinksExist=0
if git grep -q 'https://docs\.tambo\.co/' -- \
  ':(glob)**/*.ts' \
  ':(glob)**/*.tsx' \
  ':(glob)**/*.md' \
  ':(glob)**/*.mdx' \
  2>/dev/null; then
  docsLinksExist=1
fi

urls=$(
  # Stop at quotes/backticks (strings), ')' (Markdown), '}' (JSDoc), '>' (<...>), or whitespace.
  # Use `git grep` so we only scan tracked files (avoids picking up `node_modules` in CI).
  git grep -h --no-line-number -oE "$docsUrlRegex" -- \
    ':(glob)**/*.ts' \
    ':(glob)**/*.tsx' \
    ':(glob)**/*.md' \
    ':(glob)**/*.mdx' 2>/dev/null || true
)

if [ "$docsLinksExist" -eq 1 ] && [ -z "$urls" ]; then
  echo '::error::docs link validator extracted 0 URLs; likely broken regex'
  exit 1
fi

while IFS= read -r url; do
  if [ -z "$url" ]; then
    continue
  fi

  # The extraction regex intentionally doesn't try to handle every trailing-punctuation case
  # in Markdown/MDX. Trim a few common terminators as a safety net.
  url="${url%,}"
  url="${url%.}"
  url="${url%;}"
  url="${url%:}"
  url="${url%]}"

  path="${url#https://docs.tambo.co}"
  path="${path%%#*}" # strip hash
  path="${path%/}" # strip trailing slash

  case "$path" in
    /llms.txt|/llms-full.txt|/sitemap.xml|/sitemap-0.xml) continue ;;
  esac

  if [ ! -f "${docsRoot}${path}.mdx" ] && [ ! -f "${docsRoot}${path}/index.mdx" ]; then
    broken=1
    echo "::error::Broken docs.tambo.co link: $url"
  fi
done < <(printf '%s\n' "$urls" | sort -u)

if [ "$broken" -ne 0 ]; then
  exit 1
fi
