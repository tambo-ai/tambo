#!/usr/bin/env bash

set -euo pipefail

VERSION=${1:-}

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.49.0"
  exit 1
fi

TARBALL_URL="https://registry.npmjs.org/tambo/-/tambo-${VERSION}.tgz"

echo "Fetching tarball from: $TARBALL_URL"
SHA256=$(curl -sL "$TARBALL_URL" | sha256sum | awk '{print $1}')

echo ""
echo "Version: $VERSION"
echo "URL: $TARBALL_URL"
echo "SHA256: $SHA256"
echo ""
echo "Formula snippet:"
echo "  url \"$TARBALL_URL\""
echo "  sha256 \"$SHA256\""
