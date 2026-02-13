#!/bin/sh
# Sets up the team-notes directory by cloning the private repo.
# This directory is gitignored from the main Tambo repo.
# This script is for Tambo team members only — external contributors can safely ignore it.

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: must be run inside the Tambo git repository (for example, from the repo root)." >&2
  exit 1
}

if [ ! -f "$REPO_ROOT/scripts/setup-team-notes.sh" ]; then
  echo "Error: resolved git repo root ($REPO_ROOT) does not look like the Tambo repo." >&2
  echo "Make sure you're running this from within the main Tambo repository." >&2
  exit 1
fi

TEAM_NOTES_DIR="$REPO_ROOT/team-notes"
TEAM_NOTES_REMOTE="${TEAM_NOTES_REMOTE:-git@github.com:tambo-ai/team-notes.git}"

case "$TEAM_NOTES_REMOTE" in
  *[[:space:]]*)
    echo "Error: TEAM_NOTES_REMOTE contains whitespace; got: '$TEAM_NOTES_REMOTE'" >&2
    echo "Please set it to a valid git URL (no spaces)." >&2
    exit 1
    ;;
esac

if [ -d "$TEAM_NOTES_DIR/.git" ]; then
  echo "Team notes already set up at $TEAM_NOTES_DIR"
  exit 0
fi

if [ -d "$TEAM_NOTES_DIR" ]; then
  if [ -n "$(ls -A "$TEAM_NOTES_DIR" 2>/dev/null)" ]; then
    echo "Error: $TEAM_NOTES_DIR exists, is not a git repo, and is not empty."
    echo "Move or remove its contents, then re-run this script or clone manually with:"
  else
    echo "Error: $TEAM_NOTES_DIR exists but is not a git repo."
    echo "Remove it and re-run this script, or clone manually with:"
  fi
  echo "  git clone \"$TEAM_NOTES_REMOTE\" \"$TEAM_NOTES_DIR\""
  exit 1
fi

if [ ! -w "$REPO_ROOT" ]; then
  echo "Error: $REPO_ROOT is not writable; cannot create $TEAM_NOTES_DIR." >&2
  exit 1
fi

echo "Cloning team notes (requires access to tambo-ai/team-notes)..."
if git clone "$TEAM_NOTES_REMOTE" "$TEAM_NOTES_DIR"; then
  echo "Done. Open team-notes/ in Obsidian for the best experience."
else
  status=$?
  echo ""
  echo "Could not clone $TEAM_NOTES_REMOTE into $TEAM_NOTES_DIR (exit $status)."
  echo "This is usually due to missing access to tambo-ai/team-notes (SSH keys or repo permissions)."
  echo "If you customized TEAM_NOTES_REMOTE, double-check that it's a valid Git URL and reachable (git ls-remote \"$TEAM_NOTES_REMOTE\")."
  echo "This is a private repo for Tambo team members only."
  echo "If you're an external contributor, you can safely ignore this."
  echo ""
  echo "Tip: set TEAM_NOTES_REMOTE=https://github.com/tambo-ai/team-notes.git if you prefer HTTPS."
  exit 1
fi
