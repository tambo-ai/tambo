#!/bin/bash
# Auto-format hook for Claude Code
# Runs Prettier on supported files after edits

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool_input.file_path
file=$(echo "$input" | node -e "
  const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(data.tool_input?.file_path || '');
")

# Only process files Prettier supports
if [[ "$file" =~ \.(ts|tsx|js|jsx|json|md|css|scss|yaml|yml)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0

  if npx prettier --write "$file" 2>/dev/null; then
    echo "Formatted: $file"
  fi
fi
