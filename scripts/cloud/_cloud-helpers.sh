#!/usr/bin/env sh

# Shared helpers for scripts in scripts/cloud.
#
# Provides:
# - ANSI color variables (RED, GREEN, YELLOW, BLUE, NC)
# - Logging helpers: info, warn, error
# - Exit helpers: success, fail
# - Setup helpers: get_scripts_dir, get_repo_root, ensure_repo_root

# ANSI color helper variables
RED="$(printf '\033[0;31m')"
GREEN="$(printf '\033[0;32m')"
YELLOW="$(printf '\033[1;33m')"
BLUE="$(printf '\033[0;34m')"
NC="$(printf '\033[0m')" # No Color

# Logging helpers
#
# info:  blue messages to stdout
# warn:  yellow messages to stderr
# error: red messages to stderr

info() {
  printf '%s\n' "${BLUE}$*${NC}"
}

warn() {
  printf '%s\n' "${YELLOW}$*${NC}" >&2
}

error() {
  printf '%s\n' "${RED}$*${NC}" >&2
}

# Exit helpers
#
# success: print optional messages (one per argument) to stdout, then exit 0
#          (no extra coloring; callers control formatting if they need it)
# fail:    print optional messages (one per argument) in red to stderr, then exit 1
#
# Both helpers are intentionally and permanently fatal - they always terminate
# the current process. Do not reuse them for non-fatal logging.

success() {
  if [ "$#" -gt 0 ]; then
    # Print each argument on its own line to stdout
    for line in "$@"; do
      printf '%s\n' "$line"
    done
  fi
  exit 0
}

fail() {
  if [ "$#" -gt 0 ]; then
    # Print each argument on its own line to stderr
    for line in "$@"; do
      printf '%s\n' "${RED}${line}${NC}" >&2
    done
  fi
  exit 1
}

# Setup helpers

get_scripts_dir() {
  script_path=$0
  case "$script_path" in
    /*) : ;;
    *) script_path="$(pwd)/$script_path" ;;
  esac

  SCRIPT_DIR="$(dirname "$script_path")"
  printf '%s\n' "$SCRIPT_DIR"
  return 0
}

get_repo_root() {
  search_dir="${1:-$(pwd)}"
  start_dir="$search_dir"

  while [ "$search_dir" != "/" ]; do
    if [ -f "$search_dir/package.json" ]; then
      # simple check for `"name"` and `"@tambo-ai/repo"` on the same line
      if grep -Eq '"name".*"@tambo-ai/repo"' "$search_dir/package.json"; then
        printf '%s\n' "$search_dir"
        return 0
      fi
    fi
    search_dir="$(dirname "$search_dir")"
  done

  printf '%s\n' "Could not find project root (no package.json with name @tambo-ai/repo found above $start_dir)" >&2
  printf '%s\n' "Is this script inside the Tambo project folder?" >&2
  return 1
}
