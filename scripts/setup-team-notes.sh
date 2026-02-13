#!/bin/sh
# Sets up the team-notes directory by cloning the private repo.
# This directory is gitignored from the main Tambo repo.
# This script is for Tambo team members only — external contributors can safely ignore it.

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: must be run inside a git repository." >&2
  exit 1
}

TEAM_NOTES_DIR="$REPO_ROOT/team-notes"
TEAM_NOTES_REMOTE="${TEAM_NOTES_REMOTE:-git@github.com:tambo-ai/team-notes.git}"

if [ -d "$TEAM_NOTES_DIR/.git" ]; then
  echo "Team notes already set up at $TEAM_NOTES_DIR"
  exit 0
fi

if [ -d "$TEAM_NOTES_DIR" ]; then
  echo "Error: $TEAM_NOTES_DIR exists but is not a git repo."
  echo "Remove it and re-run this script, or clone manually."
  exit 1
fi

echo "Cloning team notes (requires access to tambo-ai/team-notes)..."
if git clone "$TEAM_NOTES_REMOTE" "$TEAM_NOTES_DIR"; then
  echo "Done. Open team-notes/ in Obsidian for the best experience."
else
  status=$?
  echo ""
  echo "Could not clone tambo-ai/team-notes (exit $status)."
  echo "This is a private repo for Tambo team members only."
  echo "If you're an external contributor, you can safely ignore this."
  echo ""
  echo "Tip: set TEAM_NOTES_REMOTE=https://github.com/tambo-ai/team-notes.git if you prefer HTTPS."
  exit 1
fi
