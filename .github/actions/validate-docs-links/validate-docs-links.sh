#!/usr/bin/env bash

set -euo pipefail

broken=0

docsUrlRegex='https://docs\.tambo\.co/[^[:space:]"'\''`)}>]+'

while IFS= read -r url; do
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

  if [ ! -f "docs/content/docs${path}.mdx" ] && [ ! -f "docs/content/docs${path}/index.mdx" ]; then
    broken=1
    echo "::error::Broken docs.tambo.co link: $url"
  fi
done < <(
  (
    # Stop at quotes/backticks (strings), ')' (Markdown), '}' (JSDoc), '>' (<...>), or whitespace.
    git grep -h --no-line-number -oE "$docsUrlRegex" -- \
      ':(glob)**/*.ts' \
      ':(glob)**/*.tsx' \
      ':(glob)**/*.md' \
      ':(glob)**/*.mdx' 2>/dev/null || true
  ) | sort -u
)

if [ "$broken" -ne 0 ]; then
  exit 1
fi
