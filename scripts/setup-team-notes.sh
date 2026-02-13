#!/bin/sh
# Sets up the private docs directory by cloning the private repo.
# This directory is gitignored from the main Tambo repo.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
PRIVATE_DOCS_DIR="$REPO_ROOT/team-notes"

if [ -d "$PRIVATE_DOCS_DIR/.git" ]; then
  echo "Private docs already set up at $PRIVATE_DOCS_DIR"
  exit 0
fi

if [ -d "$PRIVATE_DOCS_DIR" ]; then
  echo "Error: $PRIVATE_DOCS_DIR exists but is not a git repo."
  echo "Remove it and re-run this script, or clone manually."
  exit 1
fi

echo "Cloning private docs..."
git clone git@github.com:tambo-ai/team-notes.git "$PRIVATE_DOCS_DIR"
echo "Done. Open private-docs/ in Obsidian for the best experience."
