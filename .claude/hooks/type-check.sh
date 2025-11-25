#!/bin/bash
# Type-check hook for Claude Code
# Runs TypeScript type checking on edited files and reports errors

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool_input.file_path
file=$(echo "$input" | node -e "
  const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(data.tool_input?.file_path || '');
")

# Only process TypeScript files
if [[ "$file" =~ \.(ts|tsx)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0

  # Run tsc on the specific file with --noEmit
  # Use the project's tsconfig if available
  output=$(npx tsc --noEmit "$file" 2>&1)
  exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    echo "Types OK: $file"
  else
    # Exit code 2 feeds stderr back to Claude for processing
    echo "$output" >&2
    exit 2
  fi
fi
