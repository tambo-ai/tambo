#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Testing Homebrew formula for Tambo..."
echo ""

cd "${REPO_ROOT}"

echo "1. Checking formula syntax..."
ruby -c Formula/tambo.rb

echo ""
echo "2. Testing installation (dry run)..."
echo "   To install locally, run:"
echo "   brew install --build-from-source Formula/tambo.rb"
echo ""
echo "3. Testing with tap:"
echo "   brew tap tambo-ai/tambo"
echo "   brew install tambo"
echo ""
echo "Formula validation complete!"
