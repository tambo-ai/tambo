#!/bin/bash
# Auto-lint hook for Claude Code
# Runs ESLint --fix on TypeScript/JavaScript files after edits

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool_input.file_path
file=$(echo "$input" | node -e "
  const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  console.log(data.tool_input?.file_path || '');
")

# Only process JS/TS files
if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0

  if npx eslint --fix "$file" 2>/dev/null; then
    echo "Auto-fixed: $file"
  else
    echo "Lint checked: $file"
  fi
fi
